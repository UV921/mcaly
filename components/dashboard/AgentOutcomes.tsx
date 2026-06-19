"use client"

import { CalendarDays, CheckCircle2, ExternalLink, Mail } from "lucide-react"
import Link from "next/link"
import type { AgentOutcome } from "@/lib/ai/parse-agent-outcomes"
import { formatOutcomeWhen } from "@/lib/ai/parse-agent-outcomes"
import { dayParamFromDate } from "@/lib/calendar/timezone"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function EmailSentCard({ outcome }: { outcome: Extract<AgentOutcome, { type: "email-sent" }> }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#C4A035]/25",
        "bg-gradient-to-br from-[#C4A035]/12 via-background to-chart-2/5 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C4A035]/15 text-[#C4A035]">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">Email sent</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C4A035]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9A7B1A] dark:text-[#E8D48B]">
              <CheckCircle2 className="h-3 w-3" />
              Delivered
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your message was sent through Gmail
          </p>

          <div className="space-y-2">
            {outcome.to && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  To
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{outcome.to}</p>
              </div>
            )}
            {outcome.subject && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Subject
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{outcome.subject}</p>
              </div>
            )}
          </div>

          {outcome.gmailLink && (
            <Button asChild size="sm" className="rounded-full">
              <a href={outcome.gmailLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open in Gmail
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function mcalyCalendarHref(start?: string) {
  if (!start) return "/dashboard/calendar"
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return "/dashboard/calendar"
  return `/dashboard/calendar?day=${dayParamFromDate(d)}`
}

function MeetingScheduledCard({
  outcome,
}: {
  outcome: Extract<AgentOutcome, { type: "meeting-scheduled" }>
}) {
  const when = formatOutcomeWhen(outcome.start)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-chart-2/25",
        "bg-gradient-to-br from-chart-2/12 via-background to-primary/5 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-chart-2/15 text-chart-2">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">Meeting confirmed</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-chart-2">
              <CheckCircle2 className="h-3 w-3" />
              Scheduled
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Added to your Google Calendar — invites sent to guests
          </p>

          <div className="space-y-2">
            {outcome.title && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Event
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{outcome.title}</p>
              </div>
            )}
            {when && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  When
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{when}</p>
              </div>
            )}
            {outcome.attendees && outcome.attendees.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Attendees
                </p>
                <p className="mt-0.5 text-sm text-foreground">
                  {outcome.attendees.join(", ")}
                </p>
              </div>
            )}
          </div>

          {outcome.link && (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-full border-chart-2/30">
                <a href={outcome.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open in Calendar
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary" className="rounded-full">
                <Link href={mcalyCalendarHref(outcome.start)}>
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  View in Mcaly
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AgentOutcomeCards({
  outcomes,
  live,
}: {
  outcomes: AgentOutcome[]
  live?: boolean
}) {
  if (outcomes.length === 0 || live) return null

  return (
    <div className="space-y-3">
      {outcomes.map((outcome, i) =>
        outcome.type === "email-sent" ? (
          <EmailSentCard key={`email-${i}`} outcome={outcome} />
        ) : (
          <MeetingScheduledCard key={`meeting-${i}`} outcome={outcome} />
        )
      )}
    </div>
  )
}
