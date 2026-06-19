import { corsair } from "@/lib/corsair"

export type SendEmailInput = {
  to: string
  subject: string
  body: string
  threadId?: string
}

function buildRaw(to: string, subject: string, body: string) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ]
  return Buffer.from(lines.join("\r\n")).toString("base64url")
}

export async function sendEmail(tenantId: string, input: SendEmailInput) {
  const tenant = corsair.withTenant(tenantId)
  const raw = buildRaw(input.to, input.subject, input.body)

  const result = await tenant.gmail.api.messages.send({
    raw,
    ...(input.threadId ? { threadId: input.threadId } : {}),
  })

  return {
    id: result.id,
    threadId: result.threadId,
    to: input.to,
    subject: input.subject,
  }
}
