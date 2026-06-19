// DATA LAYER — Google Calendar (range query).
//
// One job: fetch calendar events between two dates and return them in our clean
// MeetingItem shape. Both the dashboard ("today") and the calendar page build
// on this single function — no duplicated API code.

import { corsair } from "../corsair"
import { auth } from "@clerk/nextjs/server"
import {
  DEFAULT_TIMEZONE,
  parseGoogleEventTime,
} from "./timezone"
import { isMcalyMeetingEvent } from "./filter-events"

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
  timeMinIso: string,
  timeMaxIso: string,
  displayTimeZone = DEFAULT_TIMEZONE
): Promise<MeetingItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const tenant = corsair.withTenant(userId)

  try {
    const allItems: NonNullable<Awaited<ReturnType<typeof tenant.googlecalendar.api.events.getMany>>["items"]> = []
    let pageToken: string | undefined

    do {
      const res = await tenant.googlecalendar.api.events.getMany({
        calendarId: "primary",
        timeMin: timeMinIso,
        timeMax: timeMaxIso,
        timeZone: displayTimeZone,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
        showDeleted: false,
        showHiddenInvitations: true,
        pageToken,
      })

      if (res.items?.length) allItems.push(...res.items)
      pageToken = res.nextPageToken ?? undefined
    } while (pageToken)

    return allItems
      .filter((e) => e.status !== "cancelled")
      .filter((e) => isMcalyMeetingEvent(e))
      .map((e) => {
        const eventTz = e.start?.timeZone ?? displayTimeZone

        const names = (e.attendees ?? [])
          .filter((a) => !a.self && a.responseStatus !== "declined")
          .map((a) => a.displayName || a.email)
          .filter((n): n is string => Boolean(n))

        const start = parseGoogleEventTime(
          e.start?.dateTime,
          e.start?.date,
          eventTz
        )

        return {
          id: e.id ?? crypto.randomUUID(),
          title: e.summary ?? "(no title)",
          start,
          end: parseGoogleEventTime(e.end?.dateTime, e.end?.date, eventTz),
          isAllDay: !e.start?.dateTime,
          attendees: names.length ? `with ${names.slice(0, 2).join(" & ")}` : "",
          location: e.location,
          joinLink: e.hangoutLink,
          htmlLink: e.htmlLink,
        }
      })
      .filter((e) => e.start > 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[getEventsInRange]", message)
    throw new Error(message)
  }
}
