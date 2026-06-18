import { Inbox, CalendarClock, Sparkles, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const PROBLEMS = [
  {
    icon: Inbox,
    title: "Too many emails, no clarity",
    description:
      "Important messages hide in noise. You waste time scanning instead of deciding.",
  },
  {
    icon: CalendarClock,
    title: "Meetings and mail live in silos",
    description:
      "Your calendar and inbox don't talk. You miss context before every reply.",
  },
  {
    icon: Zap,
    title: "Actions take too many clicks",
    description:
      "Drafting replies and scheduling follow-ups breaks your flow all day long.",
  },
]

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            The problem
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Email wasn&apos;t built for how you work today
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mcaly fixes the gap between reading, deciding, and doing — one calm
            workspace powered by AI and your real Gmail & Calendar data.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="rounded-[28px] border-border bg-card/80 shadow-sm"
            >
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mx-auto mt-10 max-w-3xl rounded-[28px] border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center sm:flex-row sm:text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </span>
            <div>
              <p className="font-semibold text-foreground">What Mcaly does</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prioritizes today&apos;s emails and meetings, summarizes on demand,
                and executes replies & scheduling when you ask — with your approval
                before anything sends.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
