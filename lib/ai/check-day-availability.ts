import { corsair } from "@/lib/corsair"
import { isMcalyMeetingEvent } from "@/lib/calendar/filter-events"

export type CheckDayAvailabilityInput = {
  year: number
  month: number
  day: number
  timeZone?: string
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function formatTime(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })
}

export async function checkDayAvailability(
  tenantId: string,
  input: CheckDayAvailabilityInput
) {
  const tenant = corsair.withTenant(tenantId)
  const timeZone = input.timeZone ?? "Asia/Kolkata"
  const offset = timeZone === "Asia/Kolkata" ? "+05:30" : "Z"

  const timeMin = `${input.year}-${pad(input.month)}-${pad(input.day)}T00:00:00${offset}`
  const timeMax = `${input.year}-${pad(input.month)}-${pad(input.day)}T23:59:59${offset}`

  const res = await tenant.googlecalendar.api.events.getMany({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
    showDeleted: false,
  })

  const events = (res.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .filter((e) => isMcalyMeetingEvent(e))

  const busy = events
    .map((e) => {
      const start = e.start?.dateTime ?? e.start?.date
      const end = e.end?.dateTime ?? e.end?.date
      if (!start) return null
      return {
        title: e.summary ?? "(no title)",
        start,
        end: end ?? start,
        allDay: !e.start?.dateTime,
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const dateLabel = new Date(timeMin).toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  })

  const busyBlocks = busy.map((b) =>
    b.allDay
      ? `${b.title} (all day)`
      : `${b.title}: ${formatTime(b.start, timeZone)} – ${formatTime(b.end, timeZone)}`
  )

  const mostlyFree = busy.length === 0

  return {
    date: dateLabel,
    timeZone,
    eventCount: busy.length,
    mostlyFree,
    busyBlocks,
    summary: mostlyFree
      ? `You look free on ${dateLabel} — no meetings on your calendar.`
      : `You have ${busy.length} event(s) on ${dateLabel}.`,
  }
}
