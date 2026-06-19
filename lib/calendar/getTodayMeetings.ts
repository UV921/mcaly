// DATA LAYER — convenience wrappers around getEventsInRange.
//
// These build the right date window in the user's timezone (IST by default) and
// delegate. Keeping the actual API call in ONE place means a single fix point.

import { getEventsInRange, type MeetingItem } from "./getEventsInRange"
import {
  calendarPartsInTimeZone,
  dayBoundsIso,
  DEFAULT_TIMEZONE,
  offsetForTimeZone,
} from "./timezone"

export type { MeetingItem }

function addDaysInTimeZone(
  year: number,
  month: number,
  day: number,
  delta: number,
  timeZone: string
): { year: number; month: number; day: number } {
  const offset = offsetForTimeZone(timeZone)
  const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00${offset}`)
  d.setUTCDate(d.getUTCDate() + delta)
  const next = calendarPartsInTimeZone(d, timeZone)
  return { year: next.year, month: next.month, day: next.day }
}

// Everything happening today in the user's timezone.
export async function getTodayMeetings(
  timeZone = DEFAULT_TIMEZONE
): Promise<MeetingItem[]> {
  try {
    const { year, month, day } = calendarPartsInTimeZone(new Date(), timeZone)
    const { timeMin, timeMax } = dayBoundsIso(year, month, day, timeZone)
    return await getEventsInRange(timeMin, timeMax, timeZone)
  } catch (err) {
    console.error("[getTodayMeetings]", err)
    return []
  }
}

// Monday → Sunday of the current week (in user's timezone).
export async function getThisWeekMeetings(
  timeZone = DEFAULT_TIMEZONE
): Promise<MeetingItem[]> {
  try {
    const now = new Date()
    const { year, month, day, weekday } = calendarPartsInTimeZone(now, timeZone)
    const daysSinceMonday = (weekday + 6) % 7

    const monday = addDaysInTimeZone(year, month, day, -daysSinceMonday, timeZone)
    const sunday = addDaysInTimeZone(
      monday.year,
      monday.month,
      monday.day,
      6,
      timeZone
    )

    const { timeMin } = dayBoundsIso(
      monday.year,
      monday.month,
      monday.day,
      timeZone
    )
    const { timeMax } = dayBoundsIso(
      sunday.year,
      sunday.month,
      sunday.day,
      timeZone
    )

    return await getEventsInRange(timeMin, timeMax, timeZone)
  } catch (err) {
    console.error("[getThisWeekMeetings]", err)
    return []
  }
}

// Wider window for the calendar page: 3 months back → 6 months ahead (IST).
export async function getCalendarMeetings(
  timeZone = DEFAULT_TIMEZONE
): Promise<MeetingItem[]> {
  const { year, month, day } = calendarPartsInTimeZone(new Date(), timeZone)

  const start = addDaysInTimeZone(year, month, day, -90, timeZone)
  const end = addDaysInTimeZone(year, month, day, 180, timeZone)

  const { timeMin } = dayBoundsIso(
    start.year,
    start.month,
    start.day,
    timeZone
  )
  const { timeMax } = dayBoundsIso(end.year, end.month, end.day, timeZone)

  return getEventsInRange(timeMin, timeMax, timeZone)
}
