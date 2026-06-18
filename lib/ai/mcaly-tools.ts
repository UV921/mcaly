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
import { tool, type ToolSet } from "ai"
import { z } from "zod"
import { corsair } from "@/lib/corsair"
import { scheduleMeeting } from "@/lib/ai/schedule-meeting"

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
      "Schedule a Google Calendar event with attendees. Use this whenever the user wants to book, create, or schedule a meeting. IST = timeZone Asia/Kolkata.",
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
        .array(z.string().email())
        .min(1)
        .describe("Guest email addresses"),
      description: z.string().optional(),
    }),
    execute: async (input) => {
      try {
        const event = await scheduleMeeting(userId, input)
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

  return tools
}
