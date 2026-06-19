// Calendar page — server-fetched meetings + client refresh.

import { Suspense } from "react"
import { AskMcalyBar } from "@/components/dashboard/AskMcalyBar"
import { CalendarView } from "@/components/calendar/CalendarView"
import { getCalendarMeetings } from "@/lib/calendar/getTodayMeetings"
import { getConnectionStatus } from "@/lib/connections"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const connections = await getConnectionStatus()
  let meetings: Awaited<ReturnType<typeof getCalendarMeetings>> = []
  let fetchError: string | null = null

  if (connections.calendar) {
    try {
      meetings = await getCalendarMeetings()
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Failed to load calendar"
    }
  }

  return (
    <div className="space-y-6">
      <AskMcalyBar />

      <div className="px-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Calendar
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Your schedule at a glance — pick a day to see its meetings.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="px-4 text-sm text-muted-foreground">Loading calendar…</p>
        }
      >
        <CalendarView
          initialMeetings={meetings}
          initialConnected={connections.calendar}
          initialError={fetchError}
        />
      </Suspense>
    </div>
  )
}
