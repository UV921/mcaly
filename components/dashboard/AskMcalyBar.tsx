"use client"

// Top command bar — entry point to Ask Mcaly from any dashboard page.
// On submit, navigates to /dashboard/ask?q=... so the chat page auto-sends the prompt.

import { ArrowUp, Command } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AskMcalyBar() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = prompt.trim()
    if (!text) return
    router.push(`/dashboard/ask?q=${encodeURIComponent(text)}`)
    setPrompt("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-[28px] border border-border bg-card p-2.5 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Command className="h-4 w-4" />
      </div>

      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="h-10 flex-1 border-none bg-transparent px-1 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
        placeholder="Ask Mcaly anything — summarize, reply, or schedule…"
      />

      <Button
        size="icon-lg"
        className="rounded-2xl"
        type="submit"
        disabled={!prompt.trim()}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  )
}
