import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { DashboardPreview } from "@/components/landing/DashboardPreview"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface LandingHeroProps {
  isSignedIn: boolean
  setupComplete: boolean
}

export function LandingHero({ isSignedIn, setupComplete }: LandingHeroProps) {
  const ctaHref = setupComplete ? "/dashboard" : "/sign-up"
  const ctaLabel = setupComplete ? "Open dashboard" : "Get started free"

  return (
    <section className="relative overflow-hidden pt-28 pb-8 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.78_0.12_85/0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.82_0.12_85/0.15),transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            <McalyLogo variant="icon" className="mr-1.5 inline h-4 w-4" />
            AI-first email & calendar workspace
          </Badge>

          <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Autopilot for your inbox.
            <span className="block text-primary">Focus on what matters.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Mcaly reads your Gmail, surfaces today&apos;s priorities, and acts when
            you ask — reply, schedule, and summarize in plain English through
            Corsair.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isSignedIn ? (
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
                <Link href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
                <Link href="/sign-up">
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-8 text-base"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}
