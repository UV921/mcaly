"use client"

// AGENT ACTIVITY — shows what Mcaly is doing while tools run.
// Turns raw tool names (run_script, list_operations) into a friendly step timeline.

import { getToolName, isToolUIPart, type UIMessage } from "ai"
import {
  CheckCircle2,
  CircleDashed,
  FileSearch,
  ListTree,
  Loader2,
  Plug,
  Terminal,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ToolPart = Extract<UIMessage["parts"][number], { type: string }>

/** Human-readable labels for Corsair's 4 MCP tools. */
const TOOL_META: Record<
  string,
  { label: string; description: string; icon: typeof Plug }
> = {
  corsair_setup: {
    label: "Checking connections",
    description: "Gmail & Calendar auth status",
    icon: Plug,
  },
  list_operations: {
    label: "Discovering APIs",
    description: "Finding available Gmail & Calendar actions",
    icon: ListTree,
  },
  get_schema: {
    label: "Reading API details",
    description: "Understanding required parameters",
    icon: FileSearch,
  },
  run_script: {
    label: "Executing action",
    description: "Reading inbox, sending email, or updating calendar",
    icon: Terminal,
  },
}

type StepStatus = "running" | "done" | "error" | "waiting"

function stepStatus(part: ToolPart): StepStatus {
  if (!isToolUIPart(part)) return "waiting"
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return "running"
    case "output-available":
      return "done"
    case "output-error":
    case "output-denied":
      return "error"
    case "approval-requested":
    case "approval-responded":
      return "waiting"
    default:
      return "waiting"
  }
}

function metaFor(part: ToolPart) {
  const name = isToolUIPart(part) ? getToolName(part) : "tool"
  return (
    TOOL_META[name] ?? {
      label: name.replace(/_/g, " "),
      description: "Working…",
      icon: CircleDashed,
    }
  )
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />
  }
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-chart-2" />
  }
  if (status === "error") {
    return <XCircle className="h-4 w-4 text-destructive" />
  }
  return <CircleDashed className="h-4 w-4 text-muted-foreground/50" />
}

function ToolStepRow({
  part,
  index,
  isLast,
}: {
  part: ToolPart
  index: number
  isLast: boolean
}) {
  const status = stepStatus(part)
  const meta = metaFor(part)
  const Icon = meta.icon

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <span
          className={cn(
            "absolute left-[15px] top-8 h-[calc(100%-12px)] w-px",
            status === "done" ? "bg-chart-2/40" : "bg-border"
          )}
        />
      )}

      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
          status === "running" && "border-primary/30 bg-primary/10",
          status === "done" && "border-chart-2/30 bg-chart-2/10",
          status === "error" && "border-destructive/30 bg-destructive/10",
          status === "waiting" && "border-border bg-muted/50"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            status === "running" && "text-primary",
            status === "done" && "text-chart-2",
            status === "error" && "text-destructive",
            status === "waiting" && "text-muted-foreground"
          )}
        />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{meta.label}</p>
          <StatusIcon status={status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>

        {status === "running" && (
          <p className="mt-2 text-xs text-primary/80 animate-pulse">
            Step {index + 1} in progress…
          </p>
        )}

        {status === "error" && isToolUIPart(part) && part.errorText && (
          <p className="mt-2 rounded-xl bg-destructive/5 px-2 py-1 text-xs text-destructive">
            {part.errorText.slice(0, 120)}
          </p>
        )}
      </div>
    </div>
  )
}

/** Timeline of tool steps inside one assistant turn. */
export function AgentActivityTimeline({
  parts,
  live,
}: {
  parts: UIMessage["parts"]
  live?: boolean
}) {
  const toolParts = parts.filter(isToolUIPart)
  if (toolParts.length === 0) return null

  const running = toolParts.some((p) => stepStatus(p) === "running")
  const doneCount = toolParts.filter((p) => stepStatus(p) === "done").length

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4",
        live && running && "ring-1 ring-primary/20"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Mcaly is working
        </p>
        <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
          {doneCount}/{toolParts.length} steps
        </span>
      </div>

      {toolParts.map((part, index) => (
        <ToolStepRow
          key={isToolUIPart(part) ? part.toolCallId : index}
          part={part}
          index={index}
          isLast={index === toolParts.length - 1}
        />
      ))}
    </div>
  )
}

/** Shown before any assistant message arrives. */
export function AgentWorkingPlaceholder() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Mcaly is starting…</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Connecting to Gmail & Calendar through Corsair
        </p>
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-2 animate-pulse rounded-full bg-primary/10"
              style={{ width: `${100 - i * 15}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
