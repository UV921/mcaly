/** Shared timezone helpers — Mcaly defaults to IST for Indian users. */

export const DEFAULT_TIMEZONE = "Asia/Kolkata"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function offsetForTimeZone(timeZone: string): string {
  if (timeZone === "Asia/Kolkata") return "+05:30"
  return "Z"
}

/** YYYY-MM-DD in the given IANA timezone. */
export function dateStringInTimeZone(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-CA", { timeZone })
}

export function calendarPartsInTimeZone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function dayBoundsIso(
  year: number,
  month: number,
  day: number,
  timeZone: string
): { timeMin: string; timeMax: string } {
  const offset = offsetForTimeZone(timeZone)
  const d = `${year}-${pad(month)}-${pad(day)}`
  return {
    timeMin: `${d}T00:00:00${offset}`,
    timeMax: `${d}T23:59:59${offset}`,
  }
}

/** Normalize to local midnight — react-day-picker matches modifiers by calendar day. */
export function toLocalDayDate(ts: number): Date {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isSameLocalDay(aTs: number, b: Date): boolean {
  const a = toLocalDayDate(aTs)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function parseDayParam(value?: string | null): Date | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function dayParamFromDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parse Google Calendar start/end even when offset is omitted (wall clock + timeZone). */
export function parseGoogleEventTime(
  dateTime?: string | null,
  date?: string | null,
  eventTimeZone?: string | null
): number {
  const tz = eventTimeZone ?? DEFAULT_TIMEZONE
  const offset = offsetForTimeZone(tz)

  if (dateTime) {
    if (/[+-]\d{2}:\d{2}$/.test(dateTime) || dateTime.endsWith("Z")) {
      return new Date(dateTime).getTime()
    }
    return new Date(`${dateTime}${offset}`).getTime()
  }

  if (date) {
    return new Date(`${date}T00:00:00${offset}`).getTime()
  }

  return 0
}
