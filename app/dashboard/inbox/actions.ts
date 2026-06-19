"use server"

// Server Actions for the inbox. These run ONLY on the server, but a client
// component (like EmailDetailDrawer) can call them directly as if they were
// normal async functions. That's how the click in the browser safely triggers
// server-side Gmail fetching.

import { auth } from "@clerk/nextjs/server"
import { getEmailDetails, type EmailDetail } from "@/lib/dashboard/get-emails"
import { sendEmail } from "@/lib/ai/send-email"
import { summariseEmail } from "@/lib/ai/summarise-email"

// Load a single email's full detail by id (used when a row is clicked).
export async function loadEmailDetail(id: string): Promise<EmailDetail | null> {
  return getEmailDetails(id)
}

export async function loadEmailSummary(
  subject: string,
  body: string
): Promise<{ summary: string; action: string; reply: string; priority: string }> {
  return summariseEmail(subject, body)
}

export type SendInboxReplyResult =
  | { success: true; id?: string; threadId?: string }
  | { success: false; error: string }

export async function sendInboxReply(input: {
  to: string
  subject: string
  body: string
  threadId?: string
}): Promise<SendInboxReplyResult> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: "Not signed in" }
  }

  const to = input.to.trim()
  const subject = input.subject.trim()
  const body = input.body.trim()

  if (!to || !subject || !body) {
    return { success: false, error: "Reply needs a recipient, subject, and message" }
  }

  try {
    const result = await sendEmail(userId, {
      to,
      subject,
      body,
      threadId: input.threadId,
    })
    return { success: true, id: result.id, threadId: result.threadId }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reply"
    return { success: false, error: message }
  }
}