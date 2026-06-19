import {
  calendarPartsInTimeZone,
  DEFAULT_TIMEZONE,
  offsetForTimeZone,
} from "./timezone"

export type MeetingDateFields = {
  year: number
  month: number
  day: number
  hour: number
  minute?: number
  timeZone?: string
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/** Today in the user's timezone — use for agent context and validation. */
export function getTodayContext(timeZone = DEFAULT_TIMEZONE) {
  const parts = calendarPartsInTimeZone(new Date(), timeZone)
  const label = new Date().toLocaleDateString("en-IN", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return {
    timeZone,
    label,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday,
    iso: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
  }
}

/** Human label always consistent with numeric year/month/day/hour. */
export function buildWhenLabel(fields: MeetingDateFields): string {
  const timeZone = fields.timeZone ?? DEFAULT_TIMEZONE
  const minute = fields.minute ?? 0
  const offset = offsetForTimeZone(timeZone)
  const iso = `${fields.year}-${pad(fields.month)}-${pad(fields.day)}T${pad(fields.hour)}:${pad(minute)}:00${offset}`
  const dt = new Date(iso)

  if (Number.isNaN(dt.getTime())) {
    return `${fields.year}-${pad(fields.month)}-${pad(fields.day)} at ${fields.hour}:${pad(minute)}`
  }

  return dt.toLocaleString("en-IN", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Ensure year/month/day/hour form a real wall-clock time in range. */
export function validateMeetingDate(
  fields: MeetingDateFields
): { ok: true; normalized: Required<MeetingDateFields> } | { ok: false; error: string } {
  const timeZone = fields.timeZone ?? DEFAULT_TIMEZONE
  const minute = fields.minute ?? 0
  const { year, month, day, hour } = fields

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { ok: false, error: `Invalid year: ${year}` }
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return {
      ok: false,
      error: `Invalid month: ${month}. Use 1–12 (January=1, June=6, November=11).`,
    }
  }
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    return { ok: false, error: `Invalid day ${day} for ${month}/${year}` }
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { ok: false, error: `Invalid hour: ${hour}. Use 0–23 (3 PM = 15).` }
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { ok: false, error: `Invalid minute: ${minute}` }
  }

  const offset = offsetForTimeZone(timeZone)
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${offset}`
  const ms = new Date(iso).getTime()
  if (Number.isNaN(ms)) {
    return { ok: false, error: "Could not parse meeting date/time." }
  }

  const today = getTodayContext(timeZone)
  const todayMs = new Date(
    `${today.year}-${pad(today.month)}-${pad(today.day)}T00:00:00${offset}`
  ).getTime()
  const maxFuture = todayMs + 365 * 24 * 60 * 60 * 1000

  if (ms < todayMs - 24 * 60 * 60 * 1000) {
    return {
      ok: false,
      error: `Meeting date ${year}-${pad(month)}-${pad(day)} is in the past. Today is ${today.iso} (${timeZone}).`,
    }
  }
  if (ms > maxFuture) {
    return { ok: false, error: "Meeting date is more than 1 year in the future." }
  }

  return {
    ok: true,
    normalized: { year, month, day, hour, minute, timeZone },
  }
}

export function normalizeMeetingDraftInput<T extends MeetingDateFields & Record<string, unknown>>(
  input: T
): T & { whenLabel: string } {
  const validated = validateMeetingDate(input)
  if (!validated.ok) {
    throw new Error(validated.error)
  }
  const n = validated.normalized
  return {
    ...input,
    year: n.year,
    month: n.month,
    day: n.day,
    hour: n.hour,
    minute: n.minute,
    timeZone: n.timeZone,
    whenLabel: buildWhenLabel(n),
  }
}

export function buildAgentDateContext(timeZone = DEFAULT_TIMEZONE): string {
  const today = getTodayContext(timeZone)
  const tomorrow = addCalendarDays(today.year, today.month, today.day, 1, timeZone)

  return [
    `Today: ${today.label} → year=${today.year}, month=${today.month}, day=${today.day} (${today.iso}).`,
    `Tomorrow: year=${tomorrow.year}, month=${tomorrow.month}, day=${tomorrow.day}.`,
    `Timezone: ${timeZone}. Months are 1-indexed (Jan=1, Jun=6, Nov=11, Dec=12). Hours 0–23 (3 PM = 15).`,
    `year/month/day in show_meeting_draft MUST match whenLabel. Never invent November or wrong years.`,
  ].join(" ")
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  delta: number,
  timeZone: string
) {
  const offset = offsetForTimeZone(timeZone)
  const d = new Date(
    `${year}-${pad(month)}-${pad(day)}T12:00:00${offset}`
  )
  d.setUTCDate(d.getUTCDate() + delta)
  return calendarPartsInTimeZone(d, timeZone)
}
