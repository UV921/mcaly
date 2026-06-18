// A single email row used on the Inbox page. Each row shows the sender,
// subject, a short preview, and a "Reply with AI" action on the right.
// Content comes in via props so the parent can map over fake/real data.
//
// Clicking the row calls `onOpen(id)` so the parent can open the detail drawer.

import { Mail, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Priority levels drive the color accent of the row.
export type Priority = "high" | "medium" | "low"

export interface InboxItemData {
  // Unique id (the email id) — used as the React list key.
  id: string
  sender: string
  subject: string
  preview: string
  timestamp: string
}

// Maps each priority to its colors: a left edge bar and the icon tint.
// "high" = red (destructive), "medium" = gold (primary), "low" = gray (muted).
const priorityStyles: Record<Priority, { edge: string; icon: string }> = {
  high: {
    edge: "border-l-4 border-l-destructive",
    icon: "bg-destructive/10 text-destructive",
  },
  medium: {
    edge: "border-l-4 border-l-primary",
    icon: "bg-primary/10 text-primary",
  },
  low: {
    edge: "border-l-4 border-l-muted-foreground/40",
    icon: "bg-muted text-muted-foreground",
  },
}

export function InboxItem({
  id,
  sender,
  subject,
  preview,
  timestamp,
  priority = "medium",
  onOpen,
}: InboxItemData & {
  priority?: Priority
  // Called with this email's id when the row is clicked.
  onOpen?: (id: string) => void
}) {
  const styles = priorityStyles[priority]

  return (
    <div
      // The whole row is clickable -> opens the detail drawer.
      onClick={() => onOpen?.(id)}
      className={cn(
        "flex items-center gap-4 rounded-3xl border border-border bg-background/60 p-4 transition hover:bg-muted/50",
        onOpen && "cursor-pointer",
        // Colored left edge that reflects the priority
        styles.edge
      )}
    >
      {/* Sender icon, tinted by priority */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          styles.icon
        )}
      >
        <Mail className="h-5 w-5" />
      </div>

      {/* Email details (takes up the remaining space) */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-foreground">{sender}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{subject}</p>
        <p className="truncate text-sm text-muted-foreground">{preview}</p>
      </div>

      {/* "Reply with AI" action. stopPropagation so it doesn't also open the
          drawer when clicked (it's a separate action). */}
      <Button
        size="sm"
        className="shrink-0 rounded-full"
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onOpen?.(id)
        }}
      >
        <Sparkles className="h-4 w-4" />
        Reply with AI
      </Button>
    </div>
  )
}
