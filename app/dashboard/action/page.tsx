import { TodayActions } from "@/components/dashboard/TodayActions"
import { getTodayActions } from "@/lib/dashboard/get-today-actions"

export const dynamic = "force-dynamic"

export default async function ActionPage() {
  const actions = await getTodayActions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Action
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your must-do list for today — pay bills, reply to people, and don&apos;t miss meetings.
        </p>
      </div>

      <TodayActions actions={actions} />
    </div>
  )
}
