// PRESENTATION — a single meeting row, styled like an inbox row.
// Reused by both the "selected day" list and the "this week" list so they look
// consistent. Pure display: it just renders the MeetingItem it's given.

import { CalendarDays, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MeetingItem } from "@/lib/calendar/getEventsInRange"

// "2:00 PM" for timed meetings, "All day" otherwise.
function formatTime(meeting: MeetingItem): string {
  if (meeting.isAllDay || meeting.start === 0) return "All day"
  return new Date(meeting.start).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function MeetingRow({ meeting }: { meeting: MeetingItem }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-border bg-background/60 p-4 transition hover:bg-muted/50">
      {/* Icon block */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CalendarDays className="h-5 w-5" />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {meeting.title}
        </p>

        {/* Time + attendees on one muted line */}
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {[formatTime(meeting), meeting.attendees].filter(Boolean).join(" · ")}
        </p>

        {/* Location only if present */}
        {meeting.location && (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {meeting.location}
          </p>
        )}
      </div>

      {/* Action: Join (Meet) if available, else open in Google Calendar */}
      <div className="shrink-0">
        {meeting.joinLink ? (
          <a href={meeting.joinLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="rounded-full">
              Join
            </Button>
          </a>
        ) : meeting.htmlLink ? (
          <a href={meeting.htmlLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="rounded-full text-primary">
              Open
            </Button>
          </a>
        ) : null}
      </div>
    </div>
  )
}
