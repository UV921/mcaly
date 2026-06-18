// AGENT ROUTE — the server-side brain for Ask Mcaly.

import { google } from "@ai-sdk/google"
import { auth } from "@clerk/nextjs/server"
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"
import { getMcalyTools } from "@/lib/ai/mcaly-tools"

const MCALY_SYSTEM = `You are Mcaly, a helpful email and calendar assistant.

You have Corsair tools for Gmail and Google Calendar.

Tool pattern:
1. corsair_setup — check Gmail/Calendar are connected
2. list_operations — discover endpoints (gmail.*, googlecalendar.*)
3. get_schema — inspect params before calling an endpoint
4. run_script — execute JS with \`corsair\` in scope

Rules:
- Prefer gmail.db.messages.search for reading inbox (fast).
- ALWAYS reply with a clear text message to the user after using tools. Never end silently.
- If corsair_setup says a plugin is not connected, tell the user to connect it from the sidebar.

Sending email (important):
- First draft the reply in chat and ask "Should I send this?" unless the user already said "send it" / "yes send".
- When sending, use get_schema on gmail.api.messages.send first.
- Gmail send needs a base64url-encoded RFC822 \`raw\` string. Build it in run_script like:
  const lines = [
    'To: recipient@example.com',
    'Subject: Re: ...',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Your reply body here',
  ];
  const raw = Buffer.from(lines.join('\\r\\n')).toString('base64url');
  return await corsair.gmail.api.messages.send({ raw, threadId: '...' });
- For replies, include threadId from the original message.
- If send fails, explain the error and show the draft so the user can copy it.

Be concise and friendly.`

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messages }: { messages: UIMessage[] } = await req.json()
  const tools = await getMcalyTools()

  const result = streamText({
    model: google("gemini-2.5-flash-lite"),
    system: MCALY_SYSTEM,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    // Send/reply flows need setup + list + schema + find + send (many steps).
    stopWhen: stepCountIs(12),
  })

  return result.toUIMessageStreamResponse()
}
