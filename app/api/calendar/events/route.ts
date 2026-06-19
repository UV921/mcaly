import { auth } from "@clerk/nextjs/server"
import { getCalendarMeetings } from "@/lib/calendar/getTodayMeetings"
import { getConnectionStatus } from "@/lib/connections"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const connections = await getConnectionStatus()
  if (!connections.calendar) {
    return Response.json({
      connected: false,
      meetings: [],
      error: "Google Calendar is not connected. Connect it from the sidebar.",
    })
  }

  try {
    const meetings = await getCalendarMeetings()
    const now = Date.now()
    const nextMeeting = meetings
      .filter((m) => m.start > now)
      .sort((a, b) => a.start - b.start)[0]

    return Response.json({
      connected: true,
      meetings,
      count: meetings.length,
      nextMeetingStart: nextMeeting?.start,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[api/calendar/events]", message)
    return Response.json({
      connected: true,
      meetings: [],
      error: message,
    })
  }
}
