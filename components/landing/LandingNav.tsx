"use client"

import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"

interface LandingNavProps {
  isSignedIn: boolean
  setupComplete: boolean
}

export function LandingNav({ isSignedIn, setupComplete }: LandingNavProps) {
  const primaryHref = setupComplete ? "/dashboard" : "/onboarding"
  const primaryLabel = setupComplete ? "Open dashboard" : "Get started"

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <McalyLogo variant="full" className="scale-90 sm:scale-100" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="transition hover:text-foreground">
            Problem
          </a>
          <a href="#how-it-works" className="transition hover:text-foreground">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isSignedIn ? (
            <>
              <UserButton />
              <LogoutButton variant="ghost" size="default" className="rounded-full px-4" />
              <Button asChild className="rounded-full px-5">
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/sign-up">{primaryLabel}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
