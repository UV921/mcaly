import { Link2, MessageSquareText, Sparkles } from "lucide-react"

const STEPS = [
  {
    step: "01",
    icon: Link2,
    title: "Connect Gmail & Calendar",
    description:
      "Secure OAuth through Corsair. Your data stays in your account — Mcaly just helps you use it.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Ask Mcaly anything",
    description:
      "Summarize your inbox, draft a reply, or schedule a meeting in plain English.",
  },
  {
    step: "03",
    icon: MessageSquareText,
    title: "Review and send",
    description:
      "Mcaly shows what it will do, you confirm, then it acts through Gmail and Calendar.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            From signup to autopilot in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="relative text-center md:text-left">
              <span className="text-xs font-bold tracking-widest text-primary/70">
                {step}
              </span>
              <span className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card md:mx-0">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
