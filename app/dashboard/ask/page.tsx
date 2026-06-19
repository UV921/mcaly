import { AskMcalyChat } from "@/components/dashboard/AskMcalyChat"

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: initialPrompt } = await searchParams

  return <AskMcalyChat initialPrompt={initialPrompt} />
}
