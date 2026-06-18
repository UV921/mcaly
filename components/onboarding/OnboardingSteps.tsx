"use client"

// ONBOARDING — new user setup: connect Gmail + Calendar, then enter dashboard.

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Mail,
} from "lucide-react"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ConnectionStatus } from "@/lib/connections"

interface OnboardingStepsProps {
  connections: ConnectionStatus
}

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="h-5 w-5 text-chart-2" />
  ) : (
    <Circle className="h-5 w-5 text-muted-foreground/40" />
  )
}

export function OnboardingSteps({ connections }: OnboardingStepsProps) {
  const searchParams = useSearchParams()
  const [gmail, setGmail] = useState(connections.gmail)
  const [calendar, setCalendar] = useState(connections.calendar)

  // After OAuth redirect, refresh connection flags from server props on navigation.
  useEffect(() => {
    setGmail(connections.gmail)
    setCalendar(connections.calendar)
  }, [connections.gmail, connections.calendar])

  const connectedParam = searchParams.get("connected")
  useEffect(() => {
    if (connectedParam === "gmail") setGmail(true)
    if (connectedParam === "calendar") setCalendar(true)
  }, [connectedParam])

  const ready = gmail && calendar

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <Link href="/">
          <McalyLogo variant="full" className="scale-90" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton variant="ghost" className="rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Welcome
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
            Let&apos;s connect your workspace
          </h1>
          <p className="mt-3 text-muted-foreground">
            Mcaly needs Gmail and Calendar to prioritize your day and act when
            you ask.
          </p>
        </div>

        <Card className="mt-10 rounded-[28px]">
          <CardHeader>
            <CardTitle className="text-base">Setup progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 — account (already signed in to reach this page) */}
            <div className="flex items-start gap-4">
              <StepIcon done />
              <div>
                <p className="font-medium">Create your account</p>
                <p className="text-sm text-muted-foreground">Signed in with Clerk</p>
              </div>
            </div>

            {/* Step 2 — Gmail */}
            <div className="flex items-start gap-4">
              <StepIcon done={gmail} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Connect Gmail</p>
                <p className="text-sm text-muted-foreground">
                  Read, prioritize, and reply to emails
                </p>
                {!gmail ? (
                  <Button asChild className="mt-3 rounded-full" size="sm">
                    <a href="/api/connect?plugin=gmail">
                      <Mail className="mr-2 h-4 w-4" />
                      Connect Gmail
                    </a>
                  </Button>
                ) : (
                  <p className="mt-2 text-sm text-chart-2">Connected</p>
                )}
              </div>
            </div>

            {/* Step 3 — Calendar */}
            <div className="flex items-start gap-4">
              <StepIcon done={calendar} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Connect Calendar</p>
                <p className="text-sm text-muted-foreground">
                  See meetings and schedule from Ask Mcaly
                </p>
                {!calendar ? (
                  <Button asChild className="mt-3 rounded-full" size="sm">
                    <a href="/api/connect?plugin=googlecalendar">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Connect Calendar
                    </a>
                  </Button>
                ) : (
                  <p className="mt-2 text-sm text-chart-2">Connected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3">
          {ready ? (
            <Button asChild size="lg" className="h-12 rounded-full">
              <Link href="/dashboard">
                Enter dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="h-12 rounded-full" disabled>
              Enter dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {!ready && (
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/dashboard">Skip for now — explore dashboard</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
