"use client"

// Split auth layout — Mcaly branding on the left, Clerk form on the right.

import Link from "next/link"
import { Mail, CalendarDays } from "lucide-react"
import { McalyLogo, McalyLogoLegend } from "@/components/brand/McalyLogo"
import { ThemeToggle } from "@/components/theme-toggle"
import { APP_VERSION } from "@/lib/version"

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* LEFT — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/15 via-background to-chart-2/10 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-chart-2/15 blur-3xl"
        />

        <Link href="/" className="relative z-10">
          <McalyLogo variant="full" />
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">
              Your inbox & calendar,
              <span className="block text-primary">on autopilot.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Mcaly prioritizes what matters, drafts replies, and schedules
              meetings — powered by Gmail, Calendar, and Corsair AI.
            </p>
          </div>

          <McalyLogoLegend />

          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Smart inbox
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-chart-2" />
              Live calendar
            </span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © Mcaly v{APP_VERSION} · AI-first email workspace
        </p>
      </div>

      {/* RIGHT — Clerk form */}
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="lg:hidden">
            <McalyLogo variant="full" className="scale-90" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <div className="mb-8 w-full max-w-md text-center lg:text-left">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  )
}
