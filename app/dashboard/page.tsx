// Dashboard home — the "conductor".
//
// This is an async SERVER COMPONENT. Its only job is to:
//   1. fetch the ranked "today focus" data (via the logic layer), and
//   2. hand it to the presentational components.
// It contains no fetching details and no ranking logic itself — those live in
// their own files. This is what "separation of concerns" looks like in Next.js:
// the page composes, the libs think, the components display.

import { AskMcalyBar } from "@/components/dashboard/AskMcalyBar"
import { Greeting } from "@/components/dashboard/Greeting"
import { TodayFocus } from "@/components/dashboard/TodayFocus"
import { getTodayFocus } from "@/lib/dashboard/get-today-focus"

export default async function DashboardPage() {
  // Fetch + rank everything important for today (meetings + emails).
  const focus = await getTodayFocus()

  return (
    <div className="space-y-6">
      {/* Top "ask mcaly" command bar */}
      <AskMcalyBar />

      {/* Greeting headline */}
      <Greeting />

      {/* The calm overview: what can't be skipped, what's worth a look */}
      <TodayFocus focus={focus} />
    </div>
  )
}
