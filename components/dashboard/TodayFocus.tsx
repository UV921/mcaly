// PRESENTATION LAYER — the calm "Today focus" panel.
//
// This component is intentionally "dumb": it receives data that's ALREADY been
// fetched and ranked (by lib/dashboard/get-today-focus.ts) and only decides how
// to display it. It does no data fetching and no urgency logic.
//
// It shows two quiet groups:
//   - "Can't skip today" : the urgent items
//   - "Worth a look"     : matters, but no rush
// ...plus friendly empty states so the dashboard never feels broken.

import Link from "next/link"
import { CalendarDays, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FocusItem, TodayFocus as TodayFocusData } from "@/lib/dashboard/get-today-focus"

interface TodayFocusProps {
  focus: TodayFocusData
}

// Turn a timestamp into something human. Meetings show a clock time; emails
// show how long ago they arrived.
function formatWhen(item: FocusItem): string {
  if (item.when === 0) return item.kind === "meeting" ? "All day" : ""

  const date = new Date(item.when)

  if (item.kind === "meeting") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  // Email: relative time like "3m ago" / "2h ago".
  const minutes = Math.floor((Date.now() - item.when) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// A single row. Kept small and presentational. Renders the right icon + action
// depending on whether it's a meeting or an email.
function FocusRow({ item }: { item: FocusItem }) {
  const Icon = item.kind === "meeting" ? CalendarDays : Mail
  const when = formatWhen(item)

  return (
    <div className="flex items-start gap-4 rounded-3xl border border-border bg-background/60 p-4 transition hover:bg-muted/50">
      {/* Icon block — colour-coded by source */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {/* Combine subtitle + time, skipping empties cleanly */}
          {[item.subtitle, when].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Action — meetings can be "Join" (Meet) or opened in Google Calendar;
          emails open the inbox. */}
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

export function TodayFocus({ focus }: TodayFocusProps) {
  const { cantSkip, worthLook } = focus
  // Nothing at all to show → one reassuring message.
  const nothingToday = cantSkip.length === 0 && worthLook.length === 0

  return (
    <Card className="rounded-[32px] border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-primary" />
          Today&apos;s focus
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {nothingToday ? (
          // Calm "all clear" state.
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-background/60 p-5">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up. Nothing needs you right now.
            </p>
          </div>
        ) : (
          <>
            {/* GROUP 1: Can't skip */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Can&apos;t skip today
              </h3>
              {cantSkip.length > 0 ? (
                cantSkip.map((item) => (
                  <FocusRow key={`${item.kind}-${item.id}`} item={item} />
                ))
              ) : (
                <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                  Nothing urgent — you&apos;re clear for now.
                </p>
              )}
            </section>

            {/* GROUP 2: Worth a look (only render if there's anything) */}
            {worthLook.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Worth a look
                </h3>
                {worthLook.map((item) => (
                  <FocusRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
