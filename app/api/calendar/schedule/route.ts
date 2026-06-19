import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { scheduleMeeting } from "@/lib/ai/schedule-meeting"
import { normalizeAttendeeEmails } from "@/lib/calendar/normalize-email"
import { validateMeetingDate } from "@/lib/calendar/meeting-date"
import { getConnectionStatus } from "@/lib/connections"

const bodySchema = z.object({
  title: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional().default(0),
  durationMinutes: z.number().int().positive().optional().default(60),
  timeZone: z.string().optional().default("Asia/Kolkata"),
  attendeeEmails: z.array(z.string()).min(1),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const connections = await getConnectionStatus()
  if (!connections.calendar) {
    return Response.json(
      {
        error:
          "Google Calendar is not connected. Connect it from the sidebar, then try again.",
      },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid meeting details" },
      { status: 400 }
    )
  }

  const attendeeEmails = normalizeAttendeeEmails(parsed.data.attendeeEmails)
  if (attendeeEmails.length === 0) {
    return Response.json(
      { error: "At least one valid attendee email is required." },
      { status: 400 }
    )
  }

  const dateCheck = validateMeetingDate(parsed.data)
  if (!dateCheck.ok) {
    return Response.json({ error: dateCheck.error }, { status: 400 })
  }

  try {
    const event = await scheduleMeeting(userId, {
      ...parsed.data,
      ...dateCheck.normalized,
      attendeeEmails,
    })

    revalidatePath("/dashboard/calendar")
    revalidatePath("/dashboard")

    return Response.json({
      success: true,
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      htmlLink: event.htmlLink,
      hangoutLink: event.hangoutLink,
      attendees: event.attendees?.map((a) => a.email).filter(Boolean),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[api/calendar/schedule]", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
