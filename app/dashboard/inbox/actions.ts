"use server"

// Server Actions for the inbox. These run ONLY on the server, but a client
// component (like EmailDetailDrawer) can call them directly as if they were
// normal async functions. That's how the click in the browser safely triggers
// server-side Gmail fetching.

import { getEmailDetails, type EmailDetail } from "@/lib/dashboard/get-emails"
import { summariseEmail } from "@/lib/ai/summarise-email"

// Load a single email's full detail by id (used when a row is clicked).
export async function loadEmailDetail(id: string): Promise<EmailDetail | null> {
  return getEmailDetails(id)
}

export async function loadEmailSummary(subject:string,body:string): Promise<{summary:string,action:string,reply:string,priority:string}>{
  return summariseEmail(subject,body);
}