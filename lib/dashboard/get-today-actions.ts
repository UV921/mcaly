// LOGIC LAYER — today's can't-skip actions with human reminders.
//
// Pulls meetings + important emails, detects bills/payments/deadlines,
// and returns friendly reminder copy ("remember to pay your bills", etc.).

import { getImportantEmails } from "./get-emails"
import { getTodayMeetings } from "../calendar/getTodayMeetings"
import type { EmailPriority } from "../email/email-classify"

export type ActionCategory =
  | "meeting"
  | "bill"
  | "reply"
  | "deadline"
  | "general"

export interface ActionItem {
  kind: "meeting" | "email"
  id: string
  title: string
  subtitle: string
  reminder: string
  category: ActionCategory
  when: number
  score: number
  href: string
  joinLink?: string
}

export interface TodayActions {
  cantSkip: ActionItem[]
  reminders: ActionItem[]
}

const CANT_SKIP_THRESHOLD = 90

const BILL_KEYWORDS = [
  "bill",
  "payment",
  "pay your",
  "pay now",
  "invoice",
  "amount due",
  "due date",
  "overdue",
  "subscription",
  "renewal",
  "credit card",
  "utility",
]

const DEADLINE_KEYWORDS = ["deadline", "due today", "expires", "expiring", "last day"]

const REPLY_KEYWORDS = ["reply", "respond", "get back", "waiting for you", "please confirm"]

function senderName(from?: string): string {
  if (!from) return "Unknown sender"
  const match = from.match(/^(.*?)</)
  return (match ? match[1] : from).trim() || from.trim()
}

function emailText(subject?: string, snippet?: string): string {
  return `${subject ?? ""} ${snippet ?? ""}`.toLowerCase()
}

function detectCategory(
  subject?: string,
  snippet?: string,
  priority?: EmailPriority
): ActionCategory {
  const text = emailText(subject, snippet)
  if (BILL_KEYWORDS.some((k) => text.includes(k))) return "bill"
  if (DEADLINE_KEYWORDS.some((k) => text.includes(k))) return "deadline"
  if (
    REPLY_KEYWORDS.some((k) => text.includes(k)) ||
    priority === "need-action"
  ) {
    return "reply"
  }
  return "general"
}

function reminderForEmail(
  category: ActionCategory,
  subject?: string
): string {
  const title = subject?.trim() || "this email"
  switch (category) {
    case "bill":
      return "Remember — you may need to pay a bill or handle a payment today."
    case "deadline":
      return `Don't miss the deadline on "${title}".`
    case "reply":
      return "Someone is waiting for your reply — take a moment to respond."
    default:
      return "Worth handling today while it's still fresh."
  }
}

function reminderForMeeting(minutesUntil: number, title: string): string {
  if (minutesUntil <= 60) {
    return `Your meeting "${title}" is coming up soon — don't miss it.`
  }
  return `You have "${title}" on your calendar today — block time for it.`
}

function scoreEmail(priority: EmailPriority, category: ActionCategory): number {
  if (category === "bill" || category === "deadline") return 110
  if (priority === "need-action") return 100
  if (priority === "important") return 60
  return 10
}

function scoreMeeting(start: number): number {
  const minutesUntil = (start - Date.now()) / 60000
  if (minutesUntil < 0) return 0
  if (minutesUntil <= 60) return 120
  if (minutesUntil <= 240) return 80
  return 40
}

export async function getTodayActions(): Promise<TodayActions> {
  const [meetings, emails] = await Promise.all([
    getTodayMeetings(),
    getImportantEmails(10),
  ])

  const meetingItems: ActionItem[] = meetings.map((m) => {
    const minutesUntil = (m.start - Date.now()) / 60000
    return {
      kind: "meeting",
      id: m.id,
      title: m.title,
      subtitle: m.attendees,
      reminder: reminderForMeeting(minutesUntil, m.title),
      category: "meeting",
      when: m.start,
      score: scoreMeeting(m.start),
      href: m.htmlLink ?? "/dashboard/calendar",
      joinLink: m.joinLink,
    }
  })

  const emailItems: ActionItem[] = emails.map((e) => {
    const category = detectCategory(e.subject, e.snippet, e.priority)
    return {
      kind: "email",
      id: e.id ?? `email-${e.date}`,
      title: e.subject || "(no subject)",
      subtitle: senderName(e.from),
      reminder: reminderForEmail(category, e.subject),
      category,
      when: e.date,
      score: scoreEmail(e.priority, category),
      href: e.id
        ? `/dashboard/inbox?email=${encodeURIComponent(e.id)}`
        : "/dashboard/inbox",
    }
  })

  const all = [...meetingItems, ...emailItems].sort(
    (a, b) => b.score - a.score || a.when - b.when
  )

  const cantSkip = all.filter((i) => i.score >= CANT_SKIP_THRESHOLD).slice(0, 8)
  const reminders = all
    .filter((i) => i.score < CANT_SKIP_THRESHOLD && i.score > 0)
    .slice(0, 6)

  return { cantSkip, reminders }
}
