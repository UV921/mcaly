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

  return tools
}
