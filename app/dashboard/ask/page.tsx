// ASK MCALY PAGE — full chat with history.
// AskMcalyBar on every dashboard page links here (?q=...) to auto-send the first message.

import { AskMcalyBar } from "@/components/dashboard/AskMcalyBar"
import { AskMcalyChat } from "@/components/dashboard/AskMcalyChat"

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: initialPrompt } = await searchParams

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Ask Mcaly
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Plain English in — Mcaly discovers Gmail and Calendar through Corsair.
        </p>
      </div>

      <AskMcalyBar />
      <AskMcalyChat initialPrompt={initialPrompt} />
    </div>
  )
}
