import { auth } from "@clerk/nextjs/server"
import { LandingCta, LandingFooter } from "@/components/landing/LandingCta"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingNav } from "@/components/landing/LandingNav"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { getConnectionStatus } from "@/lib/connections"

export default async function Home() {
  const { userId } = await auth()
  const connections = userId
    ? await getConnectionStatus()
    : { gmail: false, calendar: false }

  const setupComplete = connections.gmail && connections.calendar
  const isSignedIn = Boolean(userId)

  return (
    <div className="min-h-screen bg-background">
      <LandingNav isSignedIn={isSignedIn} setupComplete={setupComplete} />
      <main>
        <LandingHero isSignedIn={isSignedIn} setupComplete={setupComplete} />
        <ProblemSection />
        <HowItWorksSection />
        <LandingCta isSignedIn={isSignedIn} setupComplete={setupComplete} />
      </main>
      <LandingFooter />
    </div>
  )
}
