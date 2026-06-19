import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LandingCta, LandingFooter } from "@/components/landing/LandingCta"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingNav } from "@/components/landing/LandingNav"
import { ProblemSection } from "@/components/landing/ProblemSection"

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-background">
      <LandingNav isSignedIn={false} setupComplete={false} />
      <main>
        <LandingHero isSignedIn={false} setupComplete={false} />
        <ProblemSection />
        <HowItWorksSection />
        <LandingCta isSignedIn={false} setupComplete={false} />
      </main>
      <LandingFooter />
    </div>
  )
}
