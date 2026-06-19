"use client"

import Link from "next/link"
import { Inbox, Mail, Sparkles } from "lucide-react"
import type { InboxEmailRow, InboxSummaryPresentation } from "@/lib/ai/parse-agent-outcomes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const priorityStyles = {
  "need-action": {
    edge: "border-l-destructive",
    badge: "bg-destructive/10 text-destructive",
    icon: "bg-destructive/10 text-destructive",
    label: "Need action",
  },
  important: {
    edge: "border-l-[#C4A035]",
    badge: "bg-[#C4A035]/10 text-[#9A7B1A] dark:text-[#E8D48B]",
    icon: "bg-[#C4A035]/15 text-[#C4A035]",
    label: "Important",
  },
  "low-priority": {
    edge: "border-l-muted-foreground/30",
    badge: "bg-muted text-muted-foreground",
    icon: "bg-muted text-muted-foreground",
    label: "Low",
  },
} as const

function senderName(from?: string) {
  if (!from) return "Unknown sender"
  return from.split("<")[0].trim() || from
}

function EmailRow({ email }: { email: InboxEmailRow }) {
  const styles = priorityStyles[email.priority]

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border/70 bg-background/80 p-3.5",
        "border-l-4 transition-colors hover:bg-muted/40",
        styles.edge
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          styles.icon
        )}
      >
        <Mail className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {senderName(email.from)}
          </p>
          <Badge
            variant="secondary"
            className={cn("h-5 rounded-full px-2 text-[10px] font-medium", styles.badge)}
          >
            {styles.label}
          </Badge>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {email.dateLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-foreground">
          {email.subject ?? "(no subject)"}
        </p>
        {email.snippet && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {email.snippet}
          </p>
        )}
      </div>
    </div>
  )
}

function EmailSection({
  title,
  emails,
}: {
  title: string
  emails: InboxEmailRow[]
}) {
  if (emails.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">
        {emails.map((email, i) => (
          <EmailRow key={email.id ?? `email-${i}`} email={email} />
        ))}
      </div>
    </div>
  )
}

export function InboxSummaryCard({
  summary,
  live,
}: {
  summary: InboxSummaryPresentation
  live?: boolean
}) {
  const hasToday = summary.emails.length > 0
  const hasRecent = (summary.recentEmails?.length ?? 0) > 0
  const isEmpty = summary.totalInbox === 0

  const filterLabel =
    summary.filter === "today" ? "Today" : "Inbox"

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#C4A035]/20 bg-gradient-to-br from-[#C4A035]/8 via-background to-chart-2/5 shadow-sm",
        !live && "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
    >
      <div className="flex items-start gap-3 border-b border-border/50 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C4A035]/15 text-[#C4A035]">
          <Inbox className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{filterLabel}</p>
            <Badge variant="secondary" className="rounded-full text-xs">
              {hasToday
                ? `${summary.count} email${summary.count === 1 ? "" : "s"}`
                : `${summary.totalInbox} in inbox`}
            </Badge>
          </div>
          {summary.message && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {summary.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-foreground">No emails yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open your Inbox page to sync from Gmail
            </p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <Link href="/dashboard/inbox">Go to Inbox</Link>
            </Button>
          </div>
        ) : (
          <>
            <EmailSection
              title={summary.filter === "today" ? "Received today" : "Your emails"}
              emails={summary.emails}
            />

            {summary.filter === "today" && hasRecent && (
              <EmailSection title="Recent in inbox" emails={summary.recentEmails!} />
            )}

            {!hasToday && !hasRecent && summary.totalInbox > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No matching emails for this filter.
              </p>
            )}
          </>
        )}

        {!isEmpty && (
          <div className="flex justify-end pt-1">
            <Button asChild variant="ghost" size="sm" className="rounded-full text-xs">
              <Link href="/dashboard/inbox">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Open full inbox
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
