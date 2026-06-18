// Inbox page. Lives under /dashboard, so it automatically gets the shared
// Sidebar from app/dashboard/layout.tsx.
//
// This is a SERVER component: it fetches + classifies emails, groups them by
// priority, and hands the grouped data to <InboxList /> (a client component
// that owns the click-to-open drawer interaction).

import { AskMcalyBar } from "@/components/dashboard/AskMcalyBar"
import { InboxList } from "@/components/dashboard/InboxList"
import type { InboxItemData } from "@/components/dashboard/InboxItem"
import getEmails from "@/lib/dashboard/get-emails"

export default async function InboxPage({
  // Next.js passes the URL's query string here. In Next 15+/16 it's a Promise,
  // so we await it. We only care about ?email=<id> (set when the user clicks
  // "Open" on an email from the dashboard).
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email: initialEmailId } = await searchParams

  // Fetch + classify emails for the signed-in user.
  const emails = await getEmails()

  // Adapter: turn a raw email from getEmails() into the shape the UI needs.
  // (from -> sender, snippet -> preview, epoch date -> readable timestamp)
  const toItem = (email: (typeof emails)[number], index: number): InboxItemData => ({
    // Unique key for React lists; fall back to index if the id is missing.
    id: email.id ?? `email-${index}`,
    // "from" is usually "Name <email@x.com>" — keep just the name part.
    sender: email.from?.split("<")[0].trim() || "Unknown sender",
    subject: email.subject ?? "(no subject)",
    preview: email.snippet ?? "",
    timestamp: email.date ? new Date(email.date).toLocaleString() : "",
  })

  // Split the flat list into the three priority buckets the design uses.
  const needAction = emails.filter((e) => e.priority === "need-action").map(toItem)
  const important = emails.filter((e) => e.priority === "important").map(toItem)
  const lowPriority = emails.filter((e) => e.priority === "low-priority").map(toItem)

  return (
    <div className="space-y-6">
      {/* Top "ask mcaly" command bar (same component as the dashboard) */}
      <AskMcalyBar />

      {/* Page heading */}
      <div className="px-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Inbox
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Your emails sorted by what needs attention first.
        </p>
      </div>

      {/* Client list: renders the priority groups + the detail drawer.
          initialEmailId opens a specific email's drawer on load (deep-link). */}
      <InboxList
        needAction={needAction}
        important={important}
        lowPriority={lowPriority}
        initialEmailId={initialEmailId}
      />

      {/* Friendly empty state when there are no emails at all */}
      {emails.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">
          No emails to show yet.
        </p>
      )}
    </div>
  )
}
