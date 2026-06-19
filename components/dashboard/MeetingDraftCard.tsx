"use client"

import { CalendarDays, CalendarPlus, Loader2, Pencil } from "lucide-react"
import type { MeetingDraftOutcome } from "@/lib/ai/parse-agent-outcomes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MeetingDraftCard({
  draft,
  onConfirm,
  onEdit,
  disabled,
  scheduling,
}: {
  draft: MeetingDraftOutcome
  onConfirm: () => void
  onEdit: () => void
  disabled?: boolean
  scheduling?: boolean
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm transition-all duration-300",
        scheduling
          ? "border-chart-2/40 bg-gradient-to-br from-chart-2/15 via-background to-primary/5 ring-2 ring-chart-2/20"
          : "border-chart-2/25 bg-gradient-to-br from-chart-2/10 via-background to-primary/5"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            scheduling
              ? "bg-chart-2/20 text-chart-2"
              : "bg-chart-2/15 text-chart-2"
          )}
        >
          {scheduling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CalendarDays className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">
              {scheduling ? "Scheduling meeting…" : "Ready to schedule"}
            </p>
            <p className="text-xs text-muted-foreground">
              {scheduling
                ? "Adding this to your Google Calendar — almost done"
                : "Review the details — confirm to add this to your calendar"}
            </p>
          </div>

          {scheduling && (
            <div className="h-1.5 overflow-hidden rounded-full bg-chart-2/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-chart-2/60" />
            </div>
          )}

          {draft.calendarNote && !scheduling && (
            <p className="rounded-xl border border-chart-2/20 bg-chart-2/5 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-chart-2">Availability: </span>
              {draft.calendarNote}
            </p>
          )}

          <div
            className={cn(
              "space-y-2 text-sm transition-opacity",
              scheduling && "opacity-70"
            )}
          >
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </p>
              <p className="mt-0.5 font-medium text-foreground">{draft.title}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                When
              </p>
              <p className="mt-0.5 text-foreground">{draft.whenLabel}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="mt-0.5 text-foreground">{draft.durationMinutes} minutes</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Attendees
              </p>
              <p className="mt-0.5 text-foreground">
                {draft.attendeeEmails.join(", ")}
              </p>
            </div>
            {draft.description && (
              <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-foreground">
                  {draft.description}
                </p>
              </div>
            )}
          </div>

          {!scheduling && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={onConfirm}
                disabled={disabled}
              >
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                Confirm meeting
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={onEdit}
                disabled={disabled}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit details
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
