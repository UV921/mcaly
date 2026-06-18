// LOGIC LAYER — the dashboard "brain".
//
// This file answers one question: "Of everything happening today, what does
// the user actually need to deal with?" It pulls meetings + important emails,
// gives each a single urgency SCORE, then splits them into two calm buckets:
//   - cantSkip  : urgent, do-not-ignore items
//   - worthLook : matters, but no rush
//
// Separation of concerns:
//   - It does NOT fetch from any API directly (it calls the data-layer files).
//   - It does NOT render anything (the component does that).
// Keeping the ranking here means the UI can stay "dumb" and quiet.

import { getImportantEmails } from "./get-emails"
import { getTodayMeetings } from "../calendar/getTodayMeetings"

// A single, source-agnostic item the dashboard can render. Whether it started
// life as an email or a meeting, it ends up in this same shape.
export interface FocusItem {
  kind: "meeting" | "email"
  id: string
  title: string // meeting title or email subject
  subtitle: string // "with Priya" or the sender's name
  when: number // epoch ms — meeting start, or email received time
  score: number // urgency (higher = more urgent)
  href: string // where clicking it should take the user
  joinLink?: string // meetings only: a Meet link, if any
}

// The final result the page renders.
export interface TodayFocus {
  cantSkip: FocusItem[]
  worthLook: FocusItem[]
}

// Anything at or above this score is treated as "can't skip".
const CANT_SKIP_THRESHOLD = 90

// --- Scoring rules (tweak these freely; this is the whole "intelligence") ---

// Emails: a "need-action" email is the most urgent kind of email.
function scoreEmail(priority: string): number {
  if (priority === "need-action") return 100
  if (priority === "important") return 60
  return 10
}

// Meetings: the sooner it starts, the more urgent. (Already-started meetings
// score 0 so they don't clutter "what's next".)
function scoreMeeting(start: number): number {
  const minutesUntil = (start - Date.now()) / 60000
  if (minutesUntil < 0) return 0 // already started / past
  if (minutesUntil <= 60) return 120 // within the hour — top priority
  if (minutesUntil <= 240) return 80 // next few hours
  return 40 // later today
}

// Pull just the sender's display name out of "Name <email@x.com>".
function senderName(from?: string): string {
  if (!from) return "Unknown sender"
  const match = from.match(/^(.*?)</)
  return (match ? match[1] : from).trim() || from.trim()
}

export async function getTodayFocus(): Promise<TodayFocus> {
  // 1. Fetch both sources in parallel (they don't depend on each other).
  const [meetings, emails] = await Promise.all([
    getTodayMeetings(),
    getImportantEmails(),
  ])

  // 2. Normalize meetings -> FocusItem.
  const meetingItems: FocusItem[] = meetings.map((m) => ({
    kind: "meeting",
    id: m.id,
    title: m.title,
    subtitle: m.attendees,
    when: m.start,
    score: scoreMeeting(m.start),
    // Prefer the join link; fall back to the calendar page.
    href: m.htmlLink ?? "#",
    joinLink: m.joinLink,
  }))

  // 3. Normalize emails -> FocusItem.
  const emailItems: FocusItem[] = emails.map((e) => ({
    kind: "email",
    id: e.id ?? `email-${e.date}`,
    title: e.subject || "(no subject)",
    subtitle: senderName(e.from),
    when: e.date,
    score: scoreEmail(e.priority),
    // Link to the inbox AND tell it which email to open in the drawer.
    // (The inbox reads the ?email= param and opens that email automatically.)
    href: e.id
      ? `/dashboard/inbox?email=${encodeURIComponent(e.id)}`
      : "/dashboard/inbox",
  }))

  // 4. Merge, then sort by urgency (then by soonest time as a tie-breaker).
  const all = [...meetingItems, ...emailItems].sort(
    (a, b) => b.score - a.score || a.when - b.when
  )

  // 5. Split into the two calm buckets (capped so the dashboard stays quiet).
  const cantSkip = all.filter((i) => i.score >= CANT_SKIP_THRESHOLD).slice(0, 3)
  const worthLook = all
    .filter((i) => i.score < CANT_SKIP_THRESHOLD && i.score > 0)
    .slice(0, 3)

  return { cantSkip, worthLook }
}
