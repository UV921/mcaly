/** Google Calendar items that are not real meetings Mcaly should show or count as busy. */

type CalendarEventLike = {
  summary?: string | null
  eventType?: string | null
  transparency?: string | null
}

const NON_MEETING_EVENT_TYPES = new Set(["birthday", "fromGmail"])

const NON_MEETING_TITLE =
  /^(happy birthday!?|birthday reminder|contacts'? birthdays?)$/i

/** True for real meetings / events users care about in Mcaly UI. */
export function isMcalyMeetingEvent(event: CalendarEventLike): boolean {
  if (event.eventType && NON_MEETING_EVENT_TYPES.has(event.eventType)) {
    return false
  }

  const title = event.summary?.trim()
  if (title && NON_MEETING_TITLE.test(title)) {
    return false
  }

  return true
}
