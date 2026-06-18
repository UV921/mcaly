// A priority group on the Inbox page (e.g. "Need action", "Important",
// "Low priority"). It renders a titled card with a count badge and a list
// of email rows inside. The whole group shares one priority, which also
// colors the rows (see InboxItem).

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { InboxItem, type InboxItemData, type Priority } from "./InboxItem"

interface InboxSectionProps {
  title: string
  // Small description shown under the title (e.g. "Reply needed soon").
  description?: string
  // Priority for the whole group — drives the accent color of the badge and rows.
  priority: Priority
  items: InboxItemData[]
  // Passed down to each row; called with the email id when a row is clicked.
  onOpen?: (id: string) => void
}

// Colors for the small count "pill" next to the section title, per priority.
const badgeStyles: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
}

export function InboxSection({
  title,
  description,
  priority,
  items,
  onOpen,
}: InboxSectionProps) {
  return (
    <Card className="rounded-[32px] border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          {/* Number of emails in this group, colored to match the priority */}
          <span
            className={cn(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold",
              badgeStyles[priority]
            )}
          >
            {items.length}
          </span>
        </CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((item) => (
          // Each row inherits the section's priority for its color accent.
          <InboxItem key={item.id} priority={priority} onOpen={onOpen} {...item} />
        ))}
      </CardContent>
    </Card>
  )
}
