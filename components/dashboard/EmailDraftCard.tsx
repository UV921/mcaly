"use client"

import { CalendarPlus, Mail, Pencil, Send } from "lucide-react"
import type { EmailDraftOutcome } from "@/lib/ai/parse-agent-outcomes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EmailDraftCard({
  draft,
  onSend,
  onEdit,
  onSchedule,
  disabled,
}: {
  draft: EmailDraftOutcome
  onSend: () => void
  onEdit: () => void
  onSchedule: () => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#C4A035]/25",
        "bg-gradient-to-br from-[#C4A035]/10 via-background to-chart-2/5 shadow-sm"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C4A035]/15 text-[#C4A035]">
          <Mail className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">Ready to send</p>
            <p className="text-xs text-muted-foreground">
              A professional draft — review, edit, or send when you&apos;re happy
            </p>
          </div>

          {draft.calendarNote && (
            <p className="rounded-xl border border-chart-2/20 bg-chart-2/5 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-chart-2">Calendar: </span>
              {draft.calendarNote}
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                To
              </p>
              <p className="mt-0.5 text-foreground">{draft.to}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </p>
              <p className="mt-0.5 text-foreground">{draft.subject}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Message
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{draft.body}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={onSend}
              disabled={disabled}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send email
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
              Edit draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={onSchedule}
              disabled={disabled}
            >
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Schedule meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
