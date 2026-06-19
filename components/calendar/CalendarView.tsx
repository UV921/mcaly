"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, RefreshCw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MeetingRow } from "./MeetingRow"
import type { MeetingItem } from "@/lib/calendar/getEventsInRange"
import {
  dayParamFromDate,
  isSameLocalDay,
  parseDayParam,
  toLocalDayDate,
} from "@/lib/calendar/timezone"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  initialMeetings?: MeetingItem[]
  initialConnected?: boolean
  initialError?: string | null
}

function dayKey(ts: number): string {
  const d = toLocalDayDate(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function pickInitialDay(meetings: MeetingItem[], urlDay?: Date): Date {
  if (urlDay) return urlDay

  const now = Date.now()
  const today = new Date()

  const todayMeetings = meetings.filter((m) => isSameLocalDay(m.start, today))
  if (todayMeetings.length > 0) return today

  const upcoming = meetings
    .filter((m) => m.start >= now - 60 * 60 * 1000)
    .sort((a, b) => a.start - b.start)

  if (upcoming[0]) return toLocalDayDate(upcoming[0].start)

  return today
}

export function CalendarView({
  initialMeetings = [],
  initialConnected = true,
  initialError = null,
}: CalendarViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayParam = searchParams.get("day") ?? ""
  const shouldRefresh = searchParams.get("fresh") === "1"

  const urlDay = useMemo(
    () => parseDayParam(dayParam || null),
    [dayParam]
  )

  const [meetings, setMeetings] = useState<MeetingItem[]>(initialMeetings)
  const [loading, setLoading] = useState(initialMeetings.length === 0 && !initialError)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [connected, setConnected] = useState(initialConnected)
  const [selected, setSelected] = useState<Date | undefined>(urlDay)
  const [totalCount, setTotalCount] = useState(initialMeetings.length)
  const hasLoaded = useRef(initialMeetings.length > 0)
  const dayParamRef = useRef(dayParam)
  dayParamRef.current = dayParam

  const loadMeetings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else if (!hasLoaded.current) setLoading(true)

    try {
      const res = await fetch("/api/calendar/events", { cache: "no-store" })
      const data = (await res.json()) as {
        connected?: boolean
        meetings?: MeetingItem[]
        count?: number
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to load calendar")
        return
      }

      const loaded = data.meetings ?? []
      setConnected(data.connected !== false)
      setMeetings(loaded)
      setTotalCount(data.count ?? loaded.length)
      setError(data.error ?? null)
      hasLoaded.current = true

      setSelected((prev) => {
        const fromUrl = parseDayParam(dayParamRef.current || null)
        if (fromUrl) return fromUrl
        if (prev && loaded.some((m) => isSameLocalDay(m.start, prev))) return prev
        return pickInitialDay(loaded, fromUrl)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (urlDay) {
      setSelected(urlDay)
      return
    }
    if (initialMeetings.length > 0 && !selected) {
      setSelected(pickInitialDay(initialMeetings, urlDay))
    }
  }, [dayParam, urlDay, initialMeetings, selected])

  // After scheduling in Ask Mcaly (?fresh=1), refetch once from Google.
  useEffect(() => {
    if (!shouldRefresh) return
    void loadMeetings(true).finally(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("fresh")
      const qs = params.toString()
      router.replace(qs ? `/dashboard/calendar?${qs}` : "/dashboard/calendar", {
        scroll: false,
      })
    })
  }, [shouldRefresh, loadMeetings, router, searchParams])

  // Initial client fetch only if server had nothing and calendar is connected.
  useEffect(() => {
    if (shouldRefresh || hasLoaded.current || !connected) return
    void loadMeetings()
  }, [shouldRefresh, connected, loadMeetings])

  const refresh = () => {
    void loadMeetings(true)
  }

  const handleSelectDay = (day: Date | undefined) => {
    setSelected(day)
    if (!day) return

    const next = dayParamFromDate(day)
    if (next === dayParam) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("day", next)
    router.replace(`/dashboard/calendar?${params.toString()}`, { scroll: false })
  }

  const meetingDays = useMemo(
    () =>
      meetings
        .filter((m) => m.start > 0)
        .map((m) => toLocalDayDate(m.start)),
    [meetings]
  )

  const dayMeetings = useMemo(() => {
    if (!selected) return []
    return meetings
      .filter((m) => isSameLocalDay(m.start, selected))
      .sort((a, b) => a.start - b.start)
  }, [meetings, selected])

  const upcomingGroups = useMemo(() => {
    const now = Date.now()
    const groups = new Map<string, { date: Date; items: MeetingItem[] }>()
    for (const m of meetings) {
      if (m.start === 0 || m.start < now - 24 * 60 * 60 * 1000) continue
      const key = dayKey(m.start)
      if (!groups.has(key)) {
        groups.set(key, { date: toLocalDayDate(m.start), items: [] })
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

  const nextMeeting = useMemo(() => {
    const now = Date.now()
    return meetings
      .filter((m) => m.start > now)
      .sort((a, b) => a.start - b.start)[0]
  }, [meetings])

  const selectedLabel = selected
    ? selected.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "No day selected"

  const today = new Date()
  const showingNextMeetingDay =
    nextMeeting &&
    selected &&
    !isSameLocalDay(nextMeeting.start, today) &&
    isSameLocalDay(nextMeeting.start, selected)

  return (
    <div className="space-y-6">
      {!connected && (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Google Calendar is not connected.{" "}
          <a href="/api/connect?plugin=googlecalendar" className="font-semibold underline">
            Connect Calendar
          </a>{" "}
          to see your meetings here.
        </p>
      )}

      {error && connected && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && connected && totalCount > 0 && (
        <p className="rounded-2xl border border-chart-2/25 bg-chart-2/5 px-4 py-3 text-sm text-foreground">
          Found <strong>{totalCount}</strong> meeting{totalCount === 1 ? "" : "s"} from
          your Google Calendar.
          {nextMeeting && !showingNextMeetingDay && (
            <>
              {" "}
              Your next one is{" "}
              <button
                type="button"
                className="font-semibold text-chart-2 underline"
                onClick={() => handleSelectDay(toLocalDayDate(nextMeeting.start))}
              >
                {toLocalDayDate(nextMeeting.start).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </button>
              .
            </>
          )}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card className="rounded-[32px] border border-border">
          <CardContent className="flex justify-center p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelectDay}
              modifiers={{ hasMeeting: meetingDays }}
              modifiersClassNames={{
                hasMeeting:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedLabel}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
              onClick={refresh}
              disabled={refreshing || loading}
            >
              <RefreshCw
                className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                Loading meetings from Google Calendar…
              </p>
            ) : dayMeetings.length > 0 ? (
              dayMeetings.map((m) => <MeetingRow key={m.id} meeting={m} />)
            ) : (
              <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                {totalCount > 0
                  ? "No meetings on this day — try another date with a dot, or tap your next meeting above."
                  : "No meetings found. Schedule one in Ask Mcaly, then tap Refresh."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[32px] border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Upcoming meetings
            {!loading && totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="rounded-3xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
              Loading…
            </p>
          ) : upcomingGroups.length > 0 ? (
            upcomingGroups.map((group) => (
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
              No upcoming meetings. Schedule one in Ask Mcaly, then tap Refresh.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
