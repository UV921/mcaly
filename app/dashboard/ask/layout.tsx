import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Ask Mcaly",
  description: "Ask Mcaly to summarize, reply, or schedule — powered by your Gmail and Calendar.",
}

export default function AskLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -mb-6 flex min-h-[calc(100dvh-3.5rem)] flex-col sm:-mx-6">
      {children}
    </div>
  )
}
