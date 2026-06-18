// Calendar page — the "conductor".
//
// Async SERVER COMPONENT: it fetches this week's meetings and hands them to the
// client <CalendarView />, which owns the day-selection interaction. No logic
// here beyond fetching + composing.

import { AskMcalyBar } from "@/components/dashboard/AskMcalyBar"
import { CalendarView } from "@/components/calendar/CalendarView"
import { getThisWeekMeetings } from "@/lib/calendar/getTodayMeetings"

export default async function CalendarPage() {
  // One fetch for the whole week; the client filters per selected day.
  const meetings = await getThisWeekMeetings()

  return (
    <div className="space-y-6">
      {/* Same command bar as the other pages */}
      <AskMcalyBar />

      {/* Page heading */}
      <div className="px-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Calendar
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Your week at a glance — pick a day to see its meetings.
        </p>
      </div>

      {/* Calendar + selected-day meetings + this-week list */}
      <CalendarView meetings={meetings} />
    </div>
  )
}
