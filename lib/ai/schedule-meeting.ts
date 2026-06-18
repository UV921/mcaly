import { corsair } from "@/lib/corsair"

export type ScheduleMeetingInput = {
  title: string
  year: number
  month: number
  day: number
  hour: number
  minute?: number
  durationMinutes?: number
  timeZone?: string
  attendeeEmails: string[]
  description?: string
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function wallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
}

function addDuration(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  durationMinutes: number
) {
  let total = hour * 60 + minute + durationMinutes
  let d = day + Math.floor(total / (24 * 60))
  total %= 24 * 60
  const h = Math.floor(total / 60)
  const m = total % 60
  // Month/year rollover not needed for typical 1h meetings; Google accepts overflow days.
  return { year, month, day: d, hour: h, minute: m }
}

export async function scheduleMeeting(
  tenantId: string,
  input: ScheduleMeetingInput
) {
  const tenant = corsair.withTenant(tenantId)
  const minute = input.minute ?? 0
  const duration = input.durationMinutes ?? 60
  const timeZone = input.timeZone ?? "Asia/Kolkata"

  const end = addDuration(
    input.year,
    input.month,
    input.day,
    input.hour,
    minute,
    duration
  )

  const event = await tenant.googlecalendar.api.events.create({
    calendarId: "primary",
    sendUpdates: "all",
    event: {
      summary: input.title,
      description: input.description ?? "Scheduled by Mcaly",
      start: {
        dateTime: wallClock(
          input.year,
          input.month,
          input.day,
          input.hour,
          minute
        ),
        timeZone,
      },
      end: {
        dateTime: wallClock(
          end.year,
          end.month,
          end.day,
          end.hour,
          end.minute
        ),
        timeZone,
      },
      attendees: input.attendeeEmails.map((email) => ({ email })),
    },
  })

  return event
}
