// "Suggested actions" bar — the strip at the bottom of the design.
// These are quick one-tap things the assistant proposes. Buttons are
// visual only for now (no backend behavior).

import { CalendarPlus, PenLine, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Fake suggestions. Each has a label and an icon.
const suggestions = [
  { label: "Draft reply to Sonia", icon: PenLine },
  { label: "Schedule meeting with Rahul", icon: CalendarPlus },
  { label: "Summarize unread inbox", icon: Sparkles },
]

export function SuggestedActions() {
  return (
    <Card className="rounded-[28px] border border-border">
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Suggested actions</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="secondary"
                size="sm"
                className="rounded-full"
                type="button"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
