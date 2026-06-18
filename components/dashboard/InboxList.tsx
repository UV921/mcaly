"use client"

// Client wrapper around the inbox sections. It owns the interactive bits:
//   - which email is selected (selectedId)
//   - whether the detail drawer is open
// The server page (page.tsx) fetches + groups the emails and passes them in
// as plain props, so this component stays purely about interaction.

import { useEffect, useState } from "react"
import { InboxSection } from "./InboxSection"
import { EmailDetailDrawer } from "./EmailDetailDrawer"
import type { InboxItemData } from "./InboxItem"

interface InboxListProps {
  needAction: InboxItemData[]
  important: InboxItemData[]
  lowPriority: InboxItemData[]
  // If set (via the ?email= URL param), open this email's drawer on load.
  initialEmailId?: string
}

export function InboxList({
  needAction,
  important,
  lowPriority,
  initialEmailId,
}: InboxListProps) {
  // The email id currently shown in the drawer (null = none).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Whether the bottom drawer is open.
  const [open, setOpen] = useState(false)

  // Deep-link support: if we arrived with ?email=<id> (e.g. from the dashboard
  // "Open" button), open that email's drawer automatically.
  useEffect(() => {
    if (initialEmailId) {
      setSelectedId(initialEmailId)
      setOpen(true)
    }
  }, [initialEmailId])

  // Called when any row is clicked: remember the id and open the drawer.
  const handleOpen = (id: string) => {
    setSelectedId(id)
    setOpen(true)
  }

  return (
    <>
      {/* Priority groups, most urgent first. Empty groups are hidden. */}
      {needAction.length > 0 && (
        <InboxSection
          title="Need action"
          description="Reply or schedule these soon."
          priority="high"
          items={needAction}
          onOpen={handleOpen}
        />
      )}
      {important.length > 0 && (
        <InboxSection
          title="Important"
          description="Worth a look today."
          priority="medium"
          items={important}
          onOpen={handleOpen}
        />
      )}
      {lowPriority.length > 0 && (
        <InboxSection
          title="Low priority"
          description="No rush — handle when you have time."
          priority="low"
          items={lowPriority}
          onOpen={handleOpen}
        />
      )}

      {/* The single shared drawer. It fetches the selected email's detail. */}
      <EmailDetailDrawer
        emailId={selectedId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
