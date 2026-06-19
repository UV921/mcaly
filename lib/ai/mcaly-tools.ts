// TOOLS FACTORY — gives the Ask Mcaly agent its Corsair "hands".
//
// Why this file exists:
//   The teacher demo uses OpenAIAgentsProvider.build({ corsair, tool }).
//   We do the same for the Vercel AI SDK: take Corsair's 4 MCP tool definitions
//   and wrap them so streamText() can call them in an agent loop.
//
// Why withTenant(userId):
//   run_script executes JS with `corsair` in scope. Without a tenant, every user
//   would share the same credentials — a serious bug in multi-tenant apps.

import { buildCorsairToolDefs } from "@corsair-dev/mcp"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { tool, type ToolSet } from "ai"
import { z } from "zod"
import { corsair } from "@/lib/corsair"
import { scheduleMeeting } from "@/lib/ai/schedule-meeting"
import { checkDayAvailability } from "@/lib/ai/check-day-availability"
import { sendEmail } from "@/lib/ai/send-email"
import { getInboxEmails } from "@/lib/ai/get-inbox-emails"
import { normalizeAttendeeEmails } from "@/lib/calendar/normalize-email"
import {
  normalizeMeetingDraftInput,
  validateMeetingDate,
} from "@/lib/calendar/meeting-date"

export async function getMcalyTools(): Promise<ToolSet> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Scope Corsair to the signed-in Clerk user (Gmail + Calendar tokens).
  const tenant = corsair.withTenant(userId)

  // Corsair ships the same 4 tools for every adapter:
  //   corsair_setup, list_operations, get_schema, run_script
  const defs = buildCorsairToolDefs({
    corsair: tenant,
    tenantId: userId,
  })

  const tools: ToolSet = {}

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: z.object(def.shape),
      execute: async (input) => {
        try {
          const args = z.object(def.shape).parse(input)
          const result = await def.handler(args)
          const text = result.content
            .filter((part) => part.type === "text")
            .map((part) => ("text" in part ? part.text : ""))
            .join("\n")
          // Surface tool errors clearly so the model can explain them to the user.
          if (result.isError) return `ERROR: ${text}`
          return text
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return `ERROR: ${message}`
        }
      },
    })
  }

  // Reliable calendar scheduling — avoids run_script format mistakes (Bad Request).
  tools.schedule_meeting = tool({
    description:
      "Schedule a Google Calendar event with attendees. ONLY call after show_meeting_draft and explicit user confirmation. IST = timeZone Asia/Kolkata.",
    inputSchema: z.object({
      title: z.string().describe("Meeting title / summary"),
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      hour: z.number().int().min(0).max(23).describe("Hour in 24h local time"),
      minute: z.number().int().min(0).max(59).optional().default(0),
      durationMinutes: z
        .number()
        .int()
        .positive()
        .optional()
        .default(60)
        .describe("Meeting length in minutes"),
      timeZone: z
        .string()
        .optional()
        .default("Asia/Kolkata")
        .describe("IANA timezone, e.g. Asia/Kolkata for IST"),
      attendeeEmails: z
        .array(z.string())
        .min(1)
        .describe("Guest email addresses"),
      description: z.string().optional(),
    }),
    execute: async (input) => {
      try {
        const attendeeEmails = normalizeAttendeeEmails(input.attendeeEmails)
        if (attendeeEmails.length === 0) {
          return "ERROR: At least one valid attendee email is required."
        }
        const dateCheck = validateMeetingDate(input)
        if (!dateCheck.ok) {
          return `ERROR: ${dateCheck.error}`
        }
        const event = await scheduleMeeting(userId, {
          ...input,
          ...dateCheck.normalized,
          attendeeEmails,
        })
        revalidatePath("/dashboard/calendar")
        revalidatePath("/dashboard")
        return JSON.stringify(
          {
            success: true,
            summary: event.summary,
            start: event.start,
            end: event.end,
            htmlLink: event.htmlLink,
            hangoutLink: event.hangoutLink,
            attendees: event.attendees?.map((a) => a.email),
          },
          null,
          2
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return `ERROR: ${message}`
      }
    },
  })

  tools.check_day_availability = tool({
    description:
      "Check the user's Google Calendar for a specific day. Returns busy blocks and whether they look mostly free. ONLY use when scheduling a meeting or the email must mention real availability — NOT for birthday wishes, thank-you notes, or other simple emails.",
    inputSchema: z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      timeZone: z.string().optional().default("Asia/Kolkata"),
    }),
    execute: async (input) => {
      try {
        const result = await checkDayAvailability(userId, input)
        return JSON.stringify(result, null, 2)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return `ERROR: ${message}`
      }
    },
  })

  tools.show_email_draft = tool({
    description:
      "Present an email draft to the user for review BEFORE sending. Never send without user confirmation. Call after checking calendar if the email mentions availability.",
    inputSchema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string(),
      body: z.string().describe("Full email body plain text"),
      calendarNote: z
        .string()
        .optional()
        .describe("Short note about calendar availability used in the draft"),
      offerMeeting: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to also offer scheduling a meeting after send"),
    }),
    execute: async (input) => {
      return JSON.stringify({ type: "email-draft", ...input }, null, 2)
    },
  })

  tools.send_email = tool({
    description:
      "Send an email via Gmail. ONLY call after the user explicitly confirmed (said send, yes send, looks good, etc.). Never call on first request.",
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      threadId: z.string().optional(),
    }),
    execute: async (input) => {
      try {
        const result = await sendEmail(userId, input)
        return JSON.stringify({ success: true, ...result }, null, 2)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return `ERROR: ${message}`
      }
    },
  })

  tools.show_meeting_draft = tool({
    description:
      "Present a meeting draft for user review BEFORE scheduling. year/month/day must match real calendar (month 1–12). whenLabel is recomputed server-side.",
    inputSchema: z.object({
      title: z.string(),
      whenLabel: z
        .string()
        .optional()
        .describe("Ignored — server builds label from year/month/day/hour"),
      year: z.number().int(),
      month: z
        .number()
        .int()
        .min(1)
        .max(12)
        .describe("Month 1–12 (January=1, June=6, November=11). NOT zero-indexed."),
      day: z.number().int().min(1).max(31),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59).optional().default(0),
      durationMinutes: z.number().int().positive().optional().default(60),
      timeZone: z.string().optional().default("Asia/Kolkata"),
      attendeeEmails: z.array(z.string()).min(1),
      description: z.string().optional(),
      calendarNote: z.string().optional(),
    }),
    execute: async (input) => {
      try {
        const normalized = normalizeMeetingDraftInput(input)
        return JSON.stringify({ type: "meeting-draft", ...normalized }, null, 2)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return `ERROR: ${message}`
      }
    },
  })

  tools.get_inbox_emails = tool({
    description:
      "Read the user's Gmail inbox with from, subject, snippet, and date. ALWAYS use this (not run_script) when summarizing inbox, listing emails, or answering questions about today's mail. Syncs from Gmail if needed.",
    inputSchema: z.object({
      filter: z
        .enum(["all", "today"])
        .optional()
        .default("all")
        .describe(
          "Use 'today' only when user explicitly asks for today's emails. Use 'all' for general inbox summary."
        ),
      limit: z.number().int().min(1).max(50).optional().default(20),
      timeZone: z.string().optional().default("Asia/Kolkata"),
    }),
    execute: async (input) => {
      try {
        const result = await getInboxEmails(userId, input)
        return JSON.stringify(result, null, 2)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return `ERROR: ${message}`
      }
    },
  })

  return tools
}
