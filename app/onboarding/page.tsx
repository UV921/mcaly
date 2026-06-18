import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps"
import { getConnectionStatus } from "@/lib/connections"

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const connections = await getConnectionStatus()

  // Already fully set up — skip straight to the app.
  if (connections.gmail && connections.calendar) {
    redirect("/dashboard")
  }

  return (
    <Suspense>
      <OnboardingSteps connections={connections} />
    </Suspense>
  )
}
