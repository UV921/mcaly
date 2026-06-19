import Link from "next/link"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  MessageSquareReply,
  Timer,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type {
  ActionCategory,
  ActionItem,
  TodayActions as TodayActionsData,
} from "@/lib/dashboard/get-today-actions"

interface TodayActionsProps {
  actions: TodayActionsData
}

function categoryIcon(category: ActionCategory) {
  switch (category) {
    case "meeting":
      return CalendarDays
    case "bill":
      return CreditCard
    case "reply":
      return MessageSquareReply
    case "deadline":
      return Timer
    default:
      return Mail
  }
}

function formatWhen(item: ActionItem): string {
  if (item.when === 0) return item.kind === "meeting" ? "All day" : ""

  const date = new Date(item.when)

  if (item.kind === "meeting") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  const minutes = Math.floor((Date.now() - item.when) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ActionRow({ item }: { item: ActionItem }) {
  const Icon = categoryIcon(item.category)
  const when = formatWhen(item)

  return (
    <div className="flex items-start gap-4 rounded-3xl border border-border bg-background/60 p-4 transition hover:bg-muted/50">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {[item.subtitle, when].filter(Boolean).join(" · ")}
        </p>
        <p className="text-sm text-foreground/80">{item.reminder}</p>
      </div>

      <div className="shrink-0">
        {item.kind === "meeting" && item.joinLink ? (
          <a href={item.joinLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="rounded-full">
              Join
            </Button>
          </a>
        ) : item.href.startsWith("/") ? (
          <Link href={item.href}>
            <Button size="sm" variant="ghost" className="rounded-full text-primary">
              Open
            </Button>
          </Link>
        ) : (
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="rounded-full text-primary">
              Open
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}

export function TodayActions({ actions }: TodayActionsProps) {
  const { cantSkip, reminders } = actions
  const nothingToday = cantSkip.length === 0 && reminders.length === 0

  return (
    <Card className="rounded-[32px] border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Today&apos;s actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What you can&apos;t skip today — meetings, bills, replies, and reminders.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {nothingToday ? (
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-background/60 p-5">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up. No urgent actions for today.
            </p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-primary" />
                Can&apos;t skip today
              </h3>
              {cantSkip.length > 0 ? (
                cantSkip.map((item) => (
                  <ActionRow key={`${item.kind}-${item.id}`} item={item} />
                ))
              ) : (
                <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                  Nothing urgent right now — check reminders below.
                </p>
              )}
            </section>

            {reminders.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Reminders
                </h3>
                {reminders.map((item) => (
                  <ActionRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
