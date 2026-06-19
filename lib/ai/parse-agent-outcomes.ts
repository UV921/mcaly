// Parse completed agent actions (email sent, meeting scheduled) from tool outputs.

import { getToolName, isToolUIPart, type UIMessage } from "ai"

export type EmailSentOutcome = {
  type: "email-sent"
  to?: string
  subject?: string
  messageId?: string
  threadId?: string
  gmailLink?: string
}

export type MeetingScheduledOutcome = {
  type: "meeting-scheduled"
  title?: string
  start?: string
  end?: string
  location?: string
  link?: string
  attendees?: string[]
}

export type EmailDraftOutcome = {
  type: "email-draft"
  to: string
  subject: string
  body: string
  calendarNote?: string
  offerMeeting?: boolean
}

export type MeetingDraftOutcome = {
  type: "meeting-draft"
  title: string
  whenLabel: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  durationMinutes: number
  timeZone: string
  attendeeEmails: string[]
  description?: string
  calendarNote?: string
}

export type AgentOutcome = EmailSentOutcome | MeetingScheduledOutcome

export type AgentPresentation = AgentOutcome | EmailDraftOutcome

export type InboxEmailRow = {
  id?: string
  from?: string
  subject?: string
  snippet?: string
  dateLabel: string
  priority: "need-action" | "important" | "low-priority"
}

export type InboxSummaryPresentation = {
  filter: "all" | "today"
  count: number
  totalInbox: number
  message?: string
  emails: InboxEmailRow[]
  recentEmails?: InboxEmailRow[]
}

function extractFromCode(code: string, pattern: RegExp): string | undefined {
  const match = code.match(pattern)
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "")
}

function parseJsonValue(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith("ERROR:")) return null
  try {
    const parsed = JSON.parse(trimmed)
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function dateFromEventField(field: unknown): string | undefined {
  if (!field || typeof field !== "object") return undefined
  const f = field as Record<string, unknown>
  if (typeof f.dateTime === "string") return f.dateTime
  if (typeof f.date === "string") return f.date
  return undefined
}

function parseScheduleMeetingOutcome(output: unknown): AgentOutcome | null {
  const obj = parseJsonValue(output)
  if (!obj || obj.success !== true) return null

  const start = dateFromEventField(obj.start)
  const end = dateFromEventField(obj.end)
  const link =
    (typeof obj.htmlLink === "string" ? obj.htmlLink : undefined) ??
    (typeof obj.hangoutLink === "string" ? obj.hangoutLink : undefined)

  if (!obj.summary && !start && !link) return null

  return {
    type: "meeting-scheduled",
    title: typeof obj.summary === "string" ? obj.summary : "New meeting",
    start,
    end,
    link,
    attendees: Array.isArray(obj.attendees)
      ? obj.attendees.filter((a): a is string => typeof a === "string")
      : undefined,
  }
}

function gmailInboxLink(threadId?: string, subject?: string) {
  if (threadId) {
    return `https://mail.google.com/mail/u/0/#inbox/${threadId}`
  }
  if (subject) {
    return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(subject)}`
  }
  return "https://mail.google.com/mail/u/0/#inbox"
}

function parseSendEmailOutcome(output: unknown): AgentOutcome | null {
  const obj = parseJsonValue(output)
  if (!obj || obj.success !== true) return null
  const threadId = typeof obj.threadId === "string" ? obj.threadId : undefined
  const subject = typeof obj.subject === "string" ? obj.subject : undefined
  return {
    type: "email-sent",
    to: typeof obj.to === "string" ? obj.to : undefined,
    subject,
    messageId: typeof obj.id === "string" ? obj.id : undefined,
    threadId,
    gmailLink: gmailInboxLink(threadId, subject),
  }
}

function parseEmailDraftOutcome(output: unknown): EmailDraftOutcome | null {
  const obj = parseJsonValue(output)
  if (!obj || obj.type !== "email-draft") return null
  if (typeof obj.to !== "string" || typeof obj.subject !== "string" || typeof obj.body !== "string") {
    return null
  }
  return {
    type: "email-draft",
    to: obj.to,
    subject: obj.subject,
    body: obj.body,
    calendarNote: typeof obj.calendarNote === "string" ? obj.calendarNote : undefined,
    offerMeeting: obj.offerMeeting === true,
  }
}

function parseMeetingDraftOutcome(output: unknown): MeetingDraftOutcome | null {
  const obj = parseJsonValue(output)
  if (!obj || obj.type !== "meeting-draft") return null
  if (typeof obj.title !== "string") return null
  if (
    typeof obj.year !== "number" ||
    typeof obj.month !== "number" ||
    typeof obj.day !== "number" ||
    typeof obj.hour !== "number"
  ) {
    return null
  }
  if (!Array.isArray(obj.attendeeEmails)) return null

  const emails = obj.attendeeEmails.filter((e): e is string => typeof e === "string")
  if (emails.length === 0) return null

  const whenLabel =
    typeof obj.whenLabel === "string" && obj.whenLabel.trim()
      ? obj.whenLabel
      : "Pending"

  return {
    type: "meeting-draft",
    title: obj.title,
    whenLabel,
    year: obj.year,
    month: obj.month,
    day: obj.day,
    hour: obj.hour,
    minute: typeof obj.minute === "number" ? obj.minute : 0,
    durationMinutes:
      typeof obj.durationMinutes === "number" ? obj.durationMinutes : 60,
    timeZone: typeof obj.timeZone === "string" ? obj.timeZone : "Asia/Kolkata",
    attendeeEmails: emails,
    description: typeof obj.description === "string" ? obj.description : undefined,
    calendarNote: typeof obj.calendarNote === "string" ? obj.calendarNote : undefined,
  }
}

function parseRunScriptOutcome(input: unknown, output: unknown): AgentOutcome | null {
  const code =
    typeof input === "object" && input !== null && "code" in input
      ? String((input as { code: string }).code)
      : ""

  const obj = parseJsonValue(output)
  if (!obj) return null

  // Google Calendar event (insert / update / patch response)
  if (
    ("summary" in obj || /events\.(insert|create|update|patch)/.test(code)) &&
    ("start" in obj || "end" in obj || "htmlLink" in obj)
  ) {
    const start = dateFromEventField(obj.start)
    const end = dateFromEventField(obj.end)
    const link =
      (typeof obj.htmlLink === "string" ? obj.htmlLink : undefined) ??
      (typeof obj.hangoutLink === "string" ? obj.hangoutLink : undefined)

    if (obj.summary || start || link) {
      return {
        type: "meeting-scheduled",
        title:
          (typeof obj.summary === "string" ? obj.summary : undefined) ??
          extractFromCode(code, /summary:\s*['"]([^'"]+)['"]/i) ??
          "New meeting",
        start,
        end,
        location: typeof obj.location === "string" ? obj.location : undefined,
        link,
      }
    }
  }

  // Gmail send response — { id, threadId, labelIds? }
  const isGmailSend =
    /messages\.send/.test(code) ||
    (typeof obj.id === "string" &&
      typeof obj.threadId === "string" &&
      !("summary" in obj))

  if (isGmailSend) {
    return {
      type: "email-sent",
      to: extractFromCode(code, /To:\s*([^'\n]+)/i),
      subject:
        extractFromCode(code, /Subject:\s*([^'\n]+)/i) ??
        extractFromCode(code, /subject:\s*['"]([^'"]+)['"]/i),
      messageId: typeof obj.id === "string" ? obj.id : undefined,
      threadId: typeof obj.threadId === "string" ? obj.threadId : undefined,
    }
  }

  return null
}

export function meetingOutcomeFromResponse(data: {
  summary?: string | null
  start?: unknown
  end?: unknown
  htmlLink?: string | null
  hangoutLink?: string | null
  attendees?: (string | null | undefined)[]
}): MeetingScheduledOutcome {
  const start = dateFromEventField(data.start)
  const end = dateFromEventField(data.end)
  const link =
    (typeof data.htmlLink === "string" ? data.htmlLink : undefined) ??
    (typeof data.hangoutLink === "string" ? data.hangoutLink : undefined)

  return {
    type: "meeting-scheduled",
    title: typeof data.summary === "string" ? data.summary : "New meeting",
    start,
    end,
    link,
    attendees: Array.isArray(data.attendees)
      ? data.attendees.filter((a): a is string => typeof a === "string")
      : undefined,
  }
}

/** Collect successful email / calendar outcomes from an assistant message. */
export function parseAgentOutcomes(parts: UIMessage["parts"]): AgentOutcome[] {
  const outcomes: AgentOutcome[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    if (!isToolUIPart(part)) continue
    if (part.state !== "output-available") continue
    if (part.preliminary) continue

    const toolName = getToolName(part)
    const outcome =
      toolName === "schedule_meeting"
        ? parseScheduleMeetingOutcome(part.output)
        : toolName === "send_email"
          ? parseSendEmailOutcome(part.output)
          : toolName === "run_script"
            ? parseRunScriptOutcome(part.input, part.output)
            : null
    if (!outcome) continue

    const key =
      outcome.type === "email-sent"
        ? `email:${outcome.messageId ?? outcome.threadId ?? outcome.subject}`
        : `meeting:${outcome.title}:${outcome.start}`

    if (seen.has(key)) continue
    seen.add(key)
    outcomes.push(outcome)
  }

  return outcomes
}

/** Latest email draft awaiting user confirmation. */
export function parseEmailDraft(parts: UIMessage["parts"]): EmailDraftOutcome | null {
  let latest: EmailDraftOutcome | null = null

  for (const part of parts) {
    if (!isToolUIPart(part)) continue
    if (getToolName(part) !== "show_email_draft") continue
    if (part.state !== "output-available") continue
    if (part.preliminary) continue

    const draft = parseEmailDraftOutcome(part.output)
    if (draft) latest = draft
  }

  return latest
}

function parseEmailRow(raw: unknown): InboxEmailRow | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const priority = r.priority
  if (
    priority !== "need-action" &&
    priority !== "important" &&
    priority !== "low-priority"
  ) {
    return null
  }
  return {
    id: typeof r.id === "string" ? r.id : undefined,
    from: typeof r.from === "string" ? r.from : undefined,
    subject: typeof r.subject === "string" ? r.subject : undefined,
    snippet: typeof r.snippet === "string" ? r.snippet : undefined,
    dateLabel: typeof r.dateLabel === "string" ? r.dateLabel : "Unknown",
    priority,
  }
}

function parseInboxSummaryOutput(output: unknown): InboxSummaryPresentation | null {
  const obj = parseJsonValue(output)
  if (!obj) return null
  if (obj.filter !== "all" && obj.filter !== "today") return null

  const emails = Array.isArray(obj.emails)
    ? obj.emails.map(parseEmailRow).filter((e): e is InboxEmailRow => e !== null)
    : []

  const recentEmails = Array.isArray(obj.recentEmails)
    ? obj.recentEmails
        .map(parseEmailRow)
        .filter((e): e is InboxEmailRow => e !== null)
    : undefined

  return {
    filter: obj.filter,
    count: typeof obj.count === "number" ? obj.count : emails.length,
    totalInbox: typeof obj.totalInbox === "number" ? obj.totalInbox : emails.length,
    message: typeof obj.message === "string" ? obj.message : undefined,
    emails,
    recentEmails,
  }
}

/** Latest inbox read from get_inbox_emails tool. */
export function parseInboxSummary(
  parts: UIMessage["parts"]
): InboxSummaryPresentation | null {
  let latest: InboxSummaryPresentation | null = null

  for (const part of parts) {
    if (!isToolUIPart(part)) continue
    if (getToolName(part) !== "get_inbox_emails") continue
    if (part.state !== "output-available") continue
    if (part.preliminary) continue

    const summary = parseInboxSummaryOutput(part.output)
    if (summary) latest = summary
  }

  return latest
}

/** Latest meeting draft awaiting user confirmation. */
export function parseMeetingDraft(
  parts: UIMessage["parts"]
): MeetingDraftOutcome | null {
  let latest: MeetingDraftOutcome | null = null

  for (const part of parts) {
    if (!isToolUIPart(part)) continue
    if (getToolName(part) !== "show_meeting_draft") continue
    if (part.state !== "output-available") continue
    if (part.preliminary) continue

    const draft = parseMeetingDraftOutcome(part.output)
    if (draft) latest = draft
  }

  return latest
}

export function formatOutcomeWhen(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
