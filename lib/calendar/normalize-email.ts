/** Pull a bare email out of "Name <a@b.com>" or plain addresses. */
export function normalizeAttendeeEmail(raw: string): string | null {
  const trimmed = raw.trim()
  const angle = trimmed.match(/<([^>]+@[^>]+)>/)
  if (angle?.[1]) return angle[1].trim().toLowerCase()

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  return null
}

export function normalizeAttendeeEmails(raw: string[]): string[] {
  const out: string[] = []
  for (const item of raw) {
    const email = normalizeAttendeeEmail(item)
    if (email && !out.includes(email)) out.push(email)
  }
  return out
}
