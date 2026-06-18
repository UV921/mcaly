// Parse completed agent actions (email sent, meeting scheduled) from tool outputs.

import { getToolName, isToolUIPart, type UIMessage } from "ai"

export type EmailSentOutcome = {
  type: "email-sent"
  to?: string
  subject?: string
  messageId?: string
  threadId?: string
}

export type MeetingScheduledOutcome = {
  type: "meeting-scheduled"
  title?: string
  start?: string
  end?: string
  location?: string
  link?: string
}

export type AgentOutcome = EmailSentOutcome | MeetingScheduledOutcome

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
