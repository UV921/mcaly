// DATA LAYER — convenience wrappers around getEventsInRange.
//
// These just build the right date window and delegate. Keeping the actual API
// call in ONE place (getEventsInRange) means there's a single thing to fix or
// optimise later.

import { getEventsInRange, type MeetingItem } from "./getEventsInRange"

// Re-export so existing imports (e.g. the dashboard) keep working unchanged.
export type { MeetingItem }

// Everything happening today (00:00 → 23:59 local time).
export async function getTodayMeetings(): Promise<MeetingItem[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  return getEventsInRange(startOfDay, endOfDay)
}

// The Monday→Sunday week that contains today. Used by the calendar page for the
// "this week" list and to mark which days have meetings.
export async function getThisWeekMeetings(): Promise<MeetingItem[]> {
  const now = new Date()

  // JS: getDay() => 0 (Sun) .. 6 (Sat). We want Monday as the start of week.
  const day = now.getDay()
  const daysSinceMonday = (day + 6) % 7 // Mon=0, Tue=1, ... Sun=6

  const monday = new Date(now)
  monday.setDate(now.getDate() - daysSinceMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return getEventsInRange(monday, sunday)
}
