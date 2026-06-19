import {
  getEmailsForTenant,
  type InboxEmail,
} from "@/lib/dashboard/get-emails"

export type InboxFilter = "all" | "today"

export type InboxEmailSummary = {
  id?: string
  from?: string
  subject?: string
  snippet?: string
  date: number
  dateLabel: string
  priority: InboxEmail["priority"]
}

function dateKey(epochMs: number, timeZone: string) {
  return new Date(epochMs).toLocaleDateString("en-CA", { timeZone })
}

function formatDate(epochMs: number, timeZone: string) {
  return new Date(epochMs).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })
}

function toSummary(email: InboxEmail, timeZone: string): InboxEmailSummary {
  return {
    id: email.id,
    from: email.from,
    subject: email.subject,
    snippet: email.snippet,
    date: email.date,
    dateLabel: email.date ? formatDate(email.date, timeZone) : "Unknown",
    priority: email.priority,
  }
}

export async function getInboxEmails(
  tenantId: string,
  options?: {
    filter?: InboxFilter
    limit?: number
    timeZone?: string
  }
) {
  const filter = options?.filter ?? "all"
  const limit = options?.limit ?? 20
  const timeZone = options?.timeZone ?? "Asia/Kolkata"

  const all = await getEmailsForTenant(tenantId, limit)

  const emails =
    filter === "today"
      ? all.filter(
          (e) =>
            e.date > 0 &&
            dateKey(e.date, timeZone) === dateKey(Date.now(), timeZone)
        )
      : all

  const todayDate = dateKey(Date.now(), timeZone)
  const summaries = emails.map((e) => toSummary(e, timeZone))

  const result: {
    filter: InboxFilter
    timeZone: string
    todayDate: string
    count: number
    totalInbox: number
    emails: InboxEmailSummary[]
    message?: string
    recentEmails?: InboxEmailSummary[]
  } = {
    filter,
    timeZone,
    todayDate,
    count: summaries.length,
    totalInbox: all.length,
    emails: summaries,
  }

  if (all.length === 0) {
    result.message =
      "Inbox is empty — no emails synced yet. Open the Inbox page or connect Gmail."
  } else if (filter === "today" && summaries.length === 0) {
    result.message = `No emails received today (${todayDate}). Inbox has ${all.length} email(s) from other days.`
    result.recentEmails = all.slice(0, 8).map((e) => toSummary(e, timeZone))
  }

  return result
}
