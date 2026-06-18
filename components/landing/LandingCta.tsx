import Link from "next/link"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { Button } from "@/components/ui/button"
import { APP_VERSION } from "@/lib/version"

interface LandingCtaProps {
  isSignedIn: boolean
  setupComplete: boolean
}

export function LandingCta({ isSignedIn, setupComplete }: LandingCtaProps) {
  const href = setupComplete ? "/dashboard" : "/sign-up"
  const label = setupComplete ? "Open dashboard" : "Get started free"

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-14 text-center sm:px-12">
          <McalyLogo variant="icon" className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl">
            Ready to tame your inbox?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Connect Gmail and Calendar in under a minute. Mcaly handles the rest.
          </p>
          <div className="mt-8">
            {isSignedIn ? (
              <Button asChild size="lg" className="h-12 rounded-full px-8">
                <Link href={href}>{label}</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="h-12 rounded-full px-8">
                <Link href="/sign-up">{label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <McalyLogo variant="full" className="scale-90" />
        <p className="text-sm text-muted-foreground">
          Mcaly v{APP_VERSION} · Built with Corsair · Gmail & Calendar AI workspace
        </p>
      </div>
    </footer>
  )
}
