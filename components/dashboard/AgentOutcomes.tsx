"use client"

// Beautiful completion cards when Mcaly sends an email or schedules a meeting.

import { CalendarDays, CheckCircle2, ExternalLink, Mail, Sparkles } from "lucide-react"
import type { AgentOutcome } from "@/lib/ai/parse-agent-outcomes"
import { formatOutcomeWhen } from "@/lib/ai/parse-agent-outcomes"
import { cn } from "@/lib/utils"

function OutcomeShell({
  accent,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  accent: "mail" | "calendar"
  icon: typeof Mail
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const styles =
    accent === "mail"
      ? {
          border: "border-[#C4A035]/25",
          bg: "from-[#C4A035]/12 via-background to-chart-2/5",
          iconBg: "bg-[#C4A035]/15 text-[#C4A035]",
          badge: "bg-[#C4A035]/10 text-[#9A7B1A] dark:text-[#E8D48B]",
        }
      : {
          border: "border-chart-2/25",
          bg: "from-chart-2/12 via-background to-primary/5",
          iconBg: "bg-chart-2/15 text-chart-2",
          badge: "bg-chart-2/10 text-chart-2",
        }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm",
        styles.border,
        styles.bg
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            styles.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{title}</p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                styles.badge
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-3 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  )
}

function EmailSentCard({ outcome }: { outcome: Extract<AgentOutcome, { type: "email-sent" }> }) {
  return (
    <OutcomeShell
      accent="mail"
      icon={Mail}
      title="Email sent"
      subtitle="Your message was delivered through Gmail"
    >
      {outcome.to && <DetailRow label="To" value={outcome.to} />}
      {outcome.subject && <DetailRow label="Subject" value={outcome.subject} />}
      {!outcome.to && !outcome.subject && (
        <DetailRow label="Status" value="Message delivered successfully" />
      )}
    </OutcomeShell>
  )
}

function MeetingScheduledCard({
  outcome,
}: {
  outcome: Extract<AgentOutcome, { type: "meeting-scheduled" }>
}) {
  const when = formatOutcomeWhen(outcome.start)

  return (
    <OutcomeShell
      accent="calendar"
      icon={CalendarDays}
      title="Meeting scheduled"
      subtitle="Added to your Google Calendar"
    >
      {outcome.title && <DetailRow label="Event" value={outcome.title} />}
      {when && <DetailRow label="When" value={when} />}
      {outcome.location && <DetailRow label="Location" value={outcome.location} />}
      {outcome.link && (
        <a
          href={outcome.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-chart-2/20 bg-chart-2/5 px-3 py-2 text-xs font-medium text-chart-2 transition-colors hover:bg-chart-2/10"
        >
          Open in Google Calendar
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </OutcomeShell>
  )
}

export function AgentOutcomeCards({
  outcomes,
  live,
}: {
  outcomes: AgentOutcome[]
  live?: boolean
}) {
  if (outcomes.length === 0) return null

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-border/80 bg-background/40 p-3",
        !live && "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
    >
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Completed actions
        </p>
      </div>

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
