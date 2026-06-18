import { CalendarDays, Mail, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/** Static preview of the dashboard — shown on the landing hero. */
export function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[40px] bg-primary/10 blur-2xl dark:bg-primary/5"
      />
      <Card className="relative overflow-hidden rounded-[32px] border-border shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-4/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-chart-2/60" />
          <span className="ml-2 text-xs text-muted-foreground">Mcaly Dashboard</span>
        </div>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_1.2fr] sm:p-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Today&apos;s focus
            </p>
            {[
              { icon: Mail, title: "Reply to investor update", time: "2h ago" },
              { icon: CalendarDays, title: "Product sync at 3pm", time: "Today" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-3"
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Ask Mcaly
            </div>
            <p className="mt-3 rounded-xl bg-background/80 px-3 py-2 text-sm text-muted-foreground">
              Draft a reply to Sarah confirming Thursday 2pm…
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-3/4 animate-pulse rounded-full bg-primary/20" />
              <div className="h-2 w-1/2 animate-pulse rounded-full bg-primary/15" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
