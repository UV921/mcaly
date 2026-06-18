// DATA LAYER — Google Calendar (range query).
//
// One job: fetch calendar events between two dates and return them in our clean
// MeetingItem shape. Both the dashboard ("today") and the calendar page ("this
// week", "selected day") build on this single function — no duplicated API code.

import { corsair } from "../corsair"
import { auth } from "@clerk/nextjs/server"

// The clean shape the rest of the app uses. Optional fields (`?`) mean "might be
// missing", so callers must handle undefined (with ?? or ?.).
export interface MeetingItem {
  id: string
  title: string
  start: number // epoch ms (0 if all-day / unknown)
  end: number // epoch ms (0 if unknown)
  isAllDay: boolean
  attendees: string // e.g. "with Priya & Rahul" (empty string if none)
  location?: string
  joinLink?: string // Google Meet link, if any
  htmlLink?: string // opens the event in Google Calendar
}

// Fetch every event between timeMin and timeMax (inclusive-ish), expanding
// recurring events into individual instances so each occurrence shows up.
export async function getEventsInRange(
  timeMin: Date,
  timeMax: Date
): Promise<MeetingItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const tenant = corsair.withTenant(userId)

  try {
    const res = await tenant.googlecalendar.api.events.getMany({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true, // expand recurring events into single instances
      orderBy: "startTime", // requires singleEvents: true
      maxResults: 100,
      showDeleted: false,
    })

    return (res.items ?? [])
      .filter((e) => e.status !== "cancelled")
      .map((e) => {
        // Timed events have start.dateTime; all-day events only have start.date.
        const startStr = e.start?.dateTime ?? e.start?.date
        const endStr = e.end?.dateTime ?? e.end?.date

        // Show the OTHER people (drop yourself + anyone who declined).
        const names = (e.attendees ?? [])
          .filter((a) => !a.self && a.responseStatus !== "declined")
          .map((a) => a.displayName || a.email)
          .filter((n): n is string => Boolean(n))

        return {
          id: e.id ?? crypto.randomUUID(),
          title: e.summary ?? "(no title)",
          start: startStr ? new Date(startStr).getTime() : 0,
          end: endStr ? new Date(endStr).getTime() : 0,
          isAllDay: !e.start?.dateTime,
          attendees: names.length ? `with ${names.slice(0, 2).join(" & ")}` : "",
          location: e.location,
          joinLink: e.hangoutLink,
          htmlLink: e.htmlLink,
        }
      })
  } catch {
    // Calendar might not be connected/authorized — don't crash the page.
    return []
  }
}
