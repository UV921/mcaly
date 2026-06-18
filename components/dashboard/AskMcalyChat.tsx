"use client"

// CHAT UI — full conversation with Ask Mcaly.
// Tool activity is shown in a friendly timeline (AgentActivityTimeline).

import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  isToolUIPart,
  type UIMessage,
} from "ai"
import { Sparkles, User } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AgentActivityTimeline,
  AgentWorkingPlaceholder,
} from "@/components/dashboard/AgentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface AskMcalyChatProps {
  initialPrompt?: string
}

function AssistantMessage({
  message,
  live,
}: {
  message: UIMessage
  live?: boolean
}) {
  const textParts = message.parts.filter((p) => p.type === "text" && p.text.trim())
  const toolParts = message.parts.filter(isToolUIPart)
  const hasText = textParts.length > 0

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 max-w-[90%] space-y-3">
        {/* Tool steps — shown first so user sees progress before the answer */}
        {toolParts.length > 0 && (
          <AgentActivityTimeline parts={message.parts} live={live} />
        )}

        {/* Final text reply */}
        {hasText && (
          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">
            {textParts.map((part, index) =>
              part.type === "text" ? (
                <p key={index} className="whitespace-pre-wrap">
                  {part.text}
                </p>
              ) : null
            )}
          </div>
        )}

        {/* Tools ran but no text answer */}
        {!hasText && toolParts.length > 0 && !live && (
          <p className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground italic">
            Mcaly finished the steps above but didn&apos;t write a reply. Try
            &quot;yes, send it&quot; or ask again.
          </p>
        )}
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <p key={index} className="whitespace-pre-wrap">
              {part.text}
            </p>
          ) : null
        )}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

export function AskMcalyChat({ initialPrompt }: AskMcalyChatProps) {
  const [input, setInput] = useState("")
  const sentInitial = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  })

  const busy = status === "submitted" || status === "streaming"

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i]
    }
    return undefined
  }, [messages])

  const showPlaceholder =
    busy &&
    (status === "submitted" ||
      !lastAssistant ||
      !lastAssistant.parts.some(isToolUIPart))

  useEffect(() => {
    if (!initialPrompt || sentInitial.current) return
    sentInitial.current = true
    sendMessage({ text: initialPrompt })
  }, [initialPrompt, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <Card className="rounded-[32px] border border-border">
      <CardContent className="flex min-h-[480px] flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {messages.length === 0 && !busy && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Ask Mcaly anything</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Summarize your inbox, draft a reply, or schedule a meeting — Mcaly
                discovers Gmail and Calendar APIs through Corsair.
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const isLast = index === messages.length - 1
            const live = busy && isLast && message.role === "assistant"

            if (message.role === "user") {
              return <UserMessage key={message.id} message={message} />
            }

            return (
              <AssistantMessage
                key={message.id}
                message={message}
                live={live}
              />
            )
          })}

          {showPlaceholder && <AgentWorkingPlaceholder />}

          {error && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error.message}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              busy
                ? "Mcaly is working on your request…"
                : "Ask Mcaly to reply, schedule, or summarize…"
            }
            className="min-h-[52px] resize-none rounded-2xl border-border bg-background"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            className="h-auto rounded-2xl px-5"
            disabled={busy || !input.trim()}
          >
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
