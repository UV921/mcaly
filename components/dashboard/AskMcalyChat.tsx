"use client"

import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  isToolUIPart,
  type UIMessage,
} from "ai"
import { ArrowUp, Loader2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AgentActivityTimeline,
  AgentWorkingPlaceholder,
} from "@/components/dashboard/AgentActivity"
import { AgentOutcomeCards } from "@/components/dashboard/AgentOutcomes"
import { EmailDraftCard } from "@/components/dashboard/EmailDraftCard"
import { InboxSummaryCard } from "@/components/dashboard/InboxSummaryCard"
import { MeetingDraftCard } from "@/components/dashboard/MeetingDraftCard"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { Button } from "@/components/ui/button"
import {
  meetingOutcomeFromResponse,
  parseAgentOutcomes,
  parseEmailDraft,
  parseInboxSummary,
  parseMeetingDraft,
  type AgentOutcome,
  type EmailDraftOutcome,
  type MeetingDraftOutcome,
} from "@/lib/ai/parse-agent-outcomes"
import { dayParamFromDate } from "@/lib/calendar/timezone"
import { cn } from "@/lib/utils"

interface AskMcalyChatProps {
  initialPrompt?: string
}

function AssistantMessage({
  message,
  live,
  busy,
  schedulingMessageId,
  extraOutcomes,
  scheduleError,
  onDraftSend,
  onDraftEdit,
  onDraftSchedule,
  onMeetingConfirm,
  onMeetingEdit,
}: {
  message: UIMessage
  live?: boolean
  busy?: boolean
  schedulingMessageId?: string | null
  extraOutcomes?: AgentOutcome[]
  scheduleError?: string
  onDraftSend: (draft: EmailDraftOutcome) => void
  onDraftEdit: (draft: EmailDraftOutcome) => void
  onDraftSchedule: (draft: EmailDraftOutcome) => void
  onMeetingConfirm: (draft: MeetingDraftOutcome, messageId: string) => void
  onMeetingEdit: (draft: MeetingDraftOutcome) => void
}) {
  const textParts = message.parts.filter((p) => p.type === "text" && p.text.trim())
  const toolParts = message.parts.filter(isToolUIPart)
  const hasText = textParts.length > 0
  const outcomes = [
    ...parseAgentOutcomes(message.parts),
    ...(extraOutcomes ?? []),
  ]
  const draft = parseEmailDraft(message.parts)
  const meetingDraft = parseMeetingDraft(message.parts)
  const inboxSummary = parseInboxSummary(message.parts)
  const emailSent = outcomes.some((o) => o.type === "email-sent")
  const meetingScheduled = outcomes.some((o) => o.type === "meeting-scheduled")
  const isScheduling = schedulingMessageId === message.id
  const showDraft = draft && !emailSent && !live
  const showMeetingDraft = meetingDraft && !meetingScheduled && !live
  const showInbox =
    inboxSummary &&
    (inboxSummary.emails.length > 0 ||
      inboxSummary.totalInbox > 0 ||
      inboxSummary.message)
  const showOutcomes = outcomes.length > 0 && !live
  const hideTextForCards =
    showInbox || showDraft || showMeetingDraft || showOutcomes || isScheduling
  const showText = hasText && !hideTextForCards
  const showTimeline = toolParts.length > 0 && (live || !hideTextForCards)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {showTimeline && (
        <AgentActivityTimeline parts={message.parts} live={live} />
      )}

      {showInbox && <InboxSummaryCard summary={inboxSummary} live={live} />}

      {showDraft && (
        <EmailDraftCard
          draft={draft}
          disabled={busy}
          onSend={() => onDraftSend(draft)}
          onEdit={() => onDraftEdit(draft)}
          onSchedule={() => onDraftSchedule(draft)}
        />
      )}

      {showMeetingDraft && (
        <MeetingDraftCard
          draft={meetingDraft}
          scheduling={isScheduling}
          disabled={busy || isScheduling}
          onConfirm={() => onMeetingConfirm(meetingDraft, message.id)}
          onEdit={() => onMeetingEdit(meetingDraft)}
        />
      )}

      {scheduleError && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not schedule meeting: {scheduleError}
        </p>
      )}

      {showOutcomes && <AgentOutcomeCards outcomes={outcomes} live={live} />}

      {showText && (
        <div className="text-[15px] leading-relaxed text-foreground">
          {textParts.map((part, index) =>
            part.type === "text" ? (
              <p key={index} className="whitespace-pre-wrap">
                {part.text}
              </p>
            ) : null
          )}
        </div>
      )}

      {!showText && !hideTextForCards && toolParts.length > 0 && !live && (
        <p className="text-sm text-muted-foreground italic">
          Mcaly finished but didn&apos;t write a reply. Try &quot;yes, send it&quot;
          or ask again.
        </p>
      )}
    </div>
  )
}

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl justify-end">
      <div className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 text-[15px] text-foreground">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <p key={index} className="whitespace-pre-wrap">
              {part.text}
            </p>
          ) : null
        )}
      </div>
    </div>
  )
}

export function AskMcalyChat({ initialPrompt }: AskMcalyChatProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [schedulingMessageId, setSchedulingMessageId] = useState<string | null>(
    null
  )
  const [confirmedMeetings, setConfirmedMeetings] = useState<
    Record<string, AgentOutcome>
  >({})
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>(
    {}
  )
  const sentInitial = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  })

  const busy = status === "submitted" || status === "streaming"
  const hasConversation = messages.length > 0

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

  const submit = () => {
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const handleDraftSend = (draft: EmailDraftOutcome) => {
    if (busy) return
    sendMessage({
      text: `Yes, send the email now.\nTo: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`,
    })
  }

  const handleDraftEdit = (draft: EmailDraftOutcome) => {
    setInput(
      `Please update the email draft to ${draft.to}. Change it to say: `
    )
    textareaRef.current?.focus()
  }

  const handleDraftSchedule = (draft: EmailDraftOutcome) => {
    if (busy) return
    sendMessage({
      text: `I'd like to schedule a meeting with ${draft.to}. Please check my calendar, pick a good time, and show a meeting draft for me to confirm before booking.`,
    })
  }

  const handleMeetingConfirm = async (
    draft: MeetingDraftOutcome,
    messageId: string
  ) => {
    if (busy || schedulingMessageId) return
    setSchedulingMessageId(messageId)
    setScheduleErrors((prev) => {
      const next = { ...prev }
      delete next[messageId]
      return next
    })

    try {
      const res = await fetch("/api/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          year: draft.year,
          month: draft.month,
          day: draft.day,
          hour: draft.hour,
          minute: draft.minute,
          durationMinutes: draft.durationMinutes,
          timeZone: draft.timeZone,
          attendeeEmails: draft.attendeeEmails,
          description: draft.description,
        }),
      })

      const data = (await res.json()) as {
        success?: boolean
        error?: string
        summary?: string
        start?: unknown
        end?: unknown
        htmlLink?: string
        hangoutLink?: string
        attendees?: string[]
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to schedule meeting")
      }

      setConfirmedMeetings((prev) => ({
        ...prev,
        [messageId]: meetingOutcomeFromResponse(data),
      }))

      const meetingDay = new Date(draft.year, draft.month - 1, draft.day)
      router.push(
        `/dashboard/calendar?day=${dayParamFromDate(meetingDay)}&fresh=1`
      )
    } catch (err) {
      setScheduleErrors((prev) => ({
        ...prev,
        [messageId]:
          err instanceof Error ? err.message : "Failed to schedule meeting",
      }))
    } finally {
      setSchedulingMessageId(null)
    }
  }

  const handleMeetingEdit = (draft: MeetingDraftOutcome) => {
    setInput(`Please update the meeting draft "${draft.title}". Change it to: `)
    textareaRef.current?.focus()
  }

  const inputBar = (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mx-auto w-full max-w-2xl",
        hasConversation ? "px-4 pb-6 pt-2" : "px-4"
      )}
    >
      <div className="relative flex items-end rounded-[28px] border border-border/80 bg-card shadow-sm ring-1 ring-black/5 transition-shadow focus-within:shadow-md focus-within:ring-primary/20 dark:ring-white/5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          rows={1}
          placeholder={
            busy ? "Mcaly is thinking…" : "Ask anything about your mail or calendar…"
          }
          className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-5 py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="m-2 h-9 w-9 shrink-0 rounded-full"
          disabled={busy || !input.trim()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Mcaly can read inbox, draft replies, and schedule meetings.
      </p>
    </form>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hasConversation && !busy ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
          <McalyLogo variant="full" className="mb-8 scale-110" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What can I help you with?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Summarize, reply, or schedule — in plain English.
          </p>
          <div className="mt-10 w-full">{inputBar}</div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
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
                  busy={busy}
                  schedulingMessageId={schedulingMessageId}
                  extraOutcomes={
                    confirmedMeetings[message.id]
                      ? [confirmedMeetings[message.id]]
                      : undefined
                  }
                  scheduleError={scheduleErrors[message.id]}
                  onDraftSend={handleDraftSend}
                  onDraftEdit={handleDraftEdit}
                  onDraftSchedule={handleDraftSchedule}
                  onMeetingConfirm={handleMeetingConfirm}
                  onMeetingEdit={handleMeetingEdit}
                />
              )
            })}

            {showPlaceholder && (
              <div className="mx-auto w-full max-w-3xl">
                <AgentWorkingPlaceholder />
              </div>
            )}

            {error && (
              <p className="mx-auto max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error.message}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm">
            {inputBar}
          </div>
        </>
      )}
    </div>
  )
}
