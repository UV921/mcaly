"use client"

// INTERACTION + DISPLAY for the calendar page.
//
// This is the only CLIENT piece: it holds the "which day is selected" state.
// The page (server) fetches this week's meetings and passes them in as props,
// so this component never talks to the API itself.
//
// It shows:
//   - a month calendar (click a day; days with meetings get a dot)
//   - the SELECTED day's meetings
//   - the whole week's meetings, grouped by day (inbox-style)

import { useEffect, useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MeetingRow } from "./MeetingRow"
import type { MeetingItem } from "@/lib/calendar/getEventsInRange"

interface CalendarViewProps {
  // This week's meetings, already fetched on the server.
  meetings: MeetingItem[]
}

// True if two timestamps fall on the same calendar day.
function isSameDay(aTs: number, b: Date): boolean {
  const a = new Date(aTs)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// A stable per-day key like "2026-5-16" for grouping.
function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function CalendarView({ meetings }: CalendarViewProps) {
  // Selected day in the calendar. We start undefined and set "today" after the
  // component mounts on the client. Why: creating `new Date()` during the
  // initial render would differ between the server and the browser, causing a
  // hydration mismatch warning. Setting it in useEffect (client-only) avoids that.
  const [selected, setSelected] = useState<Date | undefined>(undefined)
  useEffect(() => {
    setSelected(new Date())
  }, [])

  // Dates that have at least one meeting → used to dot those days.
  const meetingDays = useMemo(
    () => meetings.filter((m) => m.start > 0).map((m) => new Date(m.start)),
    [meetings]
  )

  // Meetings on the selected day (sorted by start time).
  const dayMeetings = useMemo(() => {
    if (!selected) return []
    return meetings
      .filter((m) => isSameDay(m.start, selected))
      .sort((a, b) => a.start - b.start)
  }, [meetings, selected])

  // The full week grouped by day (only days that actually have meetings),
  // ordered earliest day first — same idea as the inbox's priority groups.
  const weekGroups = useMemo(() => {
    const groups = new Map<string, { date: Date; items: MeetingItem[] }>()
    for (const m of meetings) {
      if (m.start === 0) continue
      const key = dayKey(m.start)
      if (!groups.has(key)) {
        groups.set(key, { date: new Date(m.start), items: [] })
      }
      groups.get(key)!.items.push(m)
    }
    return Array.from(groups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => a.start - b.start),
      }))
  }, [meetings])

  // Friendly heading for the selected-day panel.
  const selectedLabel = selected
    ? selected.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "No day selected"

  return (
    <div className="space-y-6">
      {/* TOP: calendar (left) + selected day's meetings (right) */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Calendar picker */}
        <Card className="rounded-[32px] border border-border">
          <CardContent className="flex justify-center p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              // Dot the days that have meetings.
              modifiers={{ hasMeeting: meetingDays }}
              modifiersClassNames={{
                hasMeeting:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        {/* Selected day's meetings */}
        <Card className="rounded-[32px] border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayMeetings.length > 0 ? (
              dayMeetings.map((m) => <MeetingRow key={m.id} meeting={m} />)
            ) : (
              <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                No meetings on this day.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM: the whole week, grouped by day (inbox-style) */}
      <Card className="rounded-[32px] border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            This week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {weekGroups.length > 0 ? (
            weekGroups.map((group) => (
              <section key={dayKey(group.date.getTime())} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {group.date.toLocaleDateString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                {group.items.map((m) => (
                  <MeetingRow key={m.id} meeting={m} />
                ))}
              </section>
            ))
          ) : (
            <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
              No meetings this week.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
