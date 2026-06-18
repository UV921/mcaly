"use client"

// Bottom "down bar" that slides up when an email row is clicked.
// It shows three sections:
//   1. Email detail (sender + subject + the rendered email body)
//   2. AI summary      (placeholder for now — wired up in Step 6)
//   3. Suggested reply (editable textarea, placeholder for now)
//
// It's a CLIENT component because it's interactive (open/close + fetch on open).

import { useEffect, useRef, useState } from "react"
import {
  Sparkles,
  Mail,
  Reply,
  CalendarPlus,
  CheckCircle2,
  Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { EmailPriority } from "@/lib/email/email-classify"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { loadEmailDetail ,loadEmailSummary} from "@/app/dashboard/inbox/actions"
import type { EmailDetail } from "@/lib/dashboard/get-emails"



  

interface EmailDetailDrawerProps {
  // The id of the email to show. null = nothing selected.
  emailId: string | null
  // Whether the drawer is open, and a callback to change that.
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The shape returned by the AI summariser.
interface EmailSummary {
  summary: string
  action: string
  reply: string
  priority: string
}

// A single quick-action shown as a chip in the drawer.
interface SuggestedAction {
  label: string
  icon: LucideIcon
}

// Pick suggested actions for this email. We tailor them a little to the
// priority (urgent emails suggest scheduling/replying; low priority suggests
// archiving). These are visual for now — wire real behavior later.
function getSuggestedActions(priority?: EmailPriority): SuggestedAction[] {
  if (priority === "need-action") {
    return [
      { label: "Reply now", icon: Reply },
      { label: "Schedule meeting", icon: CalendarPlus },
      { label: "Mark done", icon: CheckCircle2 },
    ]
  }
  if (priority === "low-priority") {
    return [
      { label: "Mark done", icon: CheckCircle2 },
      { label: "Snooze", icon: Clock },
    ]
  }
  // Default (important / unknown).
  return [
    { label: "Reply", icon: Reply },
    { label: "Schedule meeting", icon: CalendarPlus },
    { label: "Snooze", icon: Clock },
  ]
}

// Turn a long URL into a short, readable label (just the domain).
// e.g. "https://www.internshala.com/abc?x=1" -> "internshala.com"
function shortUrlLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "link"
  }
}

// Render plain-text email body in a clean, theme-matched way:
//  - split on blank lines into paragraphs (nice spacing)
//  - keep single line breaks inside a paragraph
//  - replace long raw URLs with a SHORT clickable label (just the domain)
function renderReadableText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text
    .split(/\n{2,}/) // blank line = new paragraph
    .filter((para) => para.trim().length > 0)
    .map((para, i) => (
      <p
        key={i}
        className="whitespace-pre-line text-sm leading-7 text-foreground/90"
      >
        {para.split(urlRegex).map((chunk, j) =>
          /^https?:\/\//.test(chunk) ? (
            // Clickable, but shows a short domain label instead of the long URL.
            <a
              key={j}
              href={chunk}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {shortUrlLabel(chunk)}
            </a>
          ) : (
            chunk
          )
        )}
      </p>
    ))
}

// Split "Name <email@x.com>" into a friendly name + the raw email address.
function parseSender(from?: string) {
  if (!from) return { name: "Unknown sender", email: "" }
  const match = from.match(/^(.*?)<(.+?)>/)
  if (match) {
    return { name: match[1].trim() || match[2].trim(), email: match[2].trim() }
  }
  return { name: from.trim(), email: from.trim() }
}

export function EmailDetailDrawer({
  emailId,
  open,
  onOpenChange,
}: EmailDetailDrawerProps) {
  // The fetched email detail (null until loaded).
  const [detail, setDetail] = useState<EmailDetail | null>(null)
  // Loading flag so we can show a skeleton while fetching.
  const [loading, setLoading] = useState(false)
  // The editable reply text (placeholder until Step 6 fills it with AI).
  const [reply, setReply] = useState("")
  const[summary,setSummary] = useState<EmailSummary|null>(null)
  const [summaryLoading,setSummaryLoading] = useState(false)
  // Cache summaries by email id so re-opening the same email (or clicking
  // "Summarise" twice) doesn't burn another AI request.
  const summaryCache = useRef<Map<string, EmailSummary>>(new Map())

  // When the drawer opens with an id, fetch that email's full detail.
  useEffect(() => {
    if (!open || !emailId) return

    let cancelled = false
    setLoading(true)
    setDetail(null)
    setSummary(null)
    setReply("")

    loadEmailDetail(emailId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Guards against race conditions when switching emails quickly.
    return () => {
      cancelled = true
    }
  }, [open, emailId])
  // On-demand summarise: only runs when the user clicks the button, so we don't
  // burn an AI request on every drawer open. Results are cached by email id.
  const handleSummarise = async (force = false) => {
    if (!emailId || !detail?.body || summaryLoading) return

    // Already summarised this email? Reuse it — no new request.
    // (Regenerate passes force=true to bypass the cache and call again.)
    if (!force) {
      const cached = summaryCache.current.get(emailId)
      if (cached) {
        setSummary(cached)
        setReply(cached.reply)
        return
      }
    }

    setSummaryLoading(true)
    try {
      const data = await loadEmailSummary(detail.subject ?? "", detail.body ?? "")
      summaryCache.current.set(emailId, data)
      setSummary(data)
      // Pre-fill the editable reply box with the AI's draft.
      setReply(data.reply)
    } catch {
      // Don't leave the drawer spinning if the AI call fails.
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  const sender = parseSender(detail?.from)
  const recipient = parseSender(detail?.to)
  // First letter of the sender, for the round avatar.
  const initial = sender.name.charAt(0).toUpperCase() || "?"
  // Quick actions tailored to this email's priority.
  const suggestedActions = getSuggestedActions(detail?.priority)
  // Human-readable date (only once loaded).
  const dateLabel = detail?.date
    ? new Date(detail.date).toLocaleString()
    : ""

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-3xl">
        {/* HEADER: avatar + subject only (details live in their own block) */}
        <DrawerHeader className="text-left">
          <div className="flex items-start gap-3">
            {/* Round avatar with the sender's first letter */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
              {loading ? "…" : initial}
            </div>

            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-lg leading-snug">
                {loading ? "Loading…" : detail?.subject || "(no subject)"}
              </DrawerTitle>
            </div>
          </div>
        </DrawerHeader>

        {/* Scrollable body so long emails don't overflow the drawer */}
        <div className="space-y-4 overflow-y-auto px-4 pb-2">
          {/* SECTION 0: clearly labeled email fields (Subject / From / To / Date) */}
          {!loading && (
            <section className="rounded-3xl border border-border bg-card p-5">
              <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="font-medium text-muted-foreground">Subject</dt>
                <dd className="text-foreground">
                  {detail?.subject || "(no subject)"}
                </dd>

                <dt className="font-medium text-muted-foreground">From</dt>
                <dd className="min-w-0 text-foreground">
                  <span className="font-medium">{sender.name}</span>
                  {sender.email && sender.email !== sender.name && (
                    <span className="break-all text-muted-foreground">
                      {" "}
                      &lt;{sender.email}&gt;
                    </span>
                  )}
                </dd>

                {detail?.to && (
                  <>
                    <dt className="font-medium text-muted-foreground">To</dt>
                    <dd className="min-w-0 break-all text-foreground">
                      {recipient.email || recipient.name}
                    </dd>
                  </>
                )}

                {dateLabel && (
                  <>
                    <dt className="font-medium text-muted-foreground">Date</dt>
                    <dd className="text-foreground">{dateLabel}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {/* SECTION 1: the actual email content */}
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Body
            </div>

            {loading ? (
              // Simple skeleton lines while we fetch.
              <div className="space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : detail?.body ? (
              // PREFERRED: clean, theme-matched readable text (with links).
              <div className="space-y-3">{renderReadableText(detail.body)}</div>
            ) : detail?.html ? (
              // FALLBACK: only render HTML when there's no usable text version.
              <div
                className="
                  max-w-none text-sm leading-6 text-foreground
                  [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                  [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg
                  [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
                  [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold
                  [&_hr]:my-3 [&_hr]:border-border
                "
                dangerouslySetInnerHTML={{ __html: detail.html }}
              />
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {detail?.snippet || "No content."}
              </p>
            )}
          </section>

          {/* SECTION 2: AI summary — generated on demand to save AI requests */}
          <section className="rounded-3xl border border-border bg-primary/5 p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Mcaly Summary
              </div>
              {/* Re-run button once a summary exists (uses cache unless changed). */}
              {summary && !summaryLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  type="button"
                  onClick={() => handleSummarise(true)}
                >
                  Regenerate
                </Button>
              )}
            </div>
            {summaryLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ) : summary ? (
              <div className="space-y-2 text-sm">
                <p className="text-foreground">{summary.summary}</p>
              </div>
            ) : (
              // No summary yet: let the user trigger it (don't auto-spend a request).
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Get an AI summary and a suggested reply for this email.
                </p>
                <Button
                  size="sm"
                  className="rounded-full"
                  type="button"
                  onClick={() => handleSummarise()}
                  disabled={loading || !detail?.body}
                >
                  <Sparkles className="h-4 w-4" />
                  Summarise with AI
                </Button>
              </div>
            )}
          </section>

          {/* SECTION 3: suggested actions (quick chips like Reply / Schedule) */}
          {!loading && (
            <section className="rounded-3xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Suggested actions
              </div>

              {/* AI's recommended action (only once a summary is generated). */}
              {summary?.action && (
                <div className="mb-3 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Mcaly suggests: </span>
                    {summary.action}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {suggestedActions.map((action) => {
                  const Icon = action.icon
                  return (
                    // Visual only for now — each will trigger a real action later.
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
            </section>
          )}

          {/* SECTION 4: suggested reply (editable, ready for Step 6) */}
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Suggested reply
            </div>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={
                summaryLoading
                  ? "Drafting a reply…"
                  : "AI-suggested reply will appear here. You can edit it before sending."
              }
              className="min-h-28"
            />
          </section>
        </div>

        <DrawerFooter className="flex-row justify-end gap-2">
          <DrawerClose asChild>
            <Button variant="ghost" className="rounded-full">
              Close
            </Button>
          </DrawerClose>
          {/* Send is visual-only for now (no backend send yet). */}
          <Button className="rounded-full" type="button" disabled={!reply}>
            Send reply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
