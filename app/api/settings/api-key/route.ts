import { auth } from "@clerk/nextjs/server"
import {
  hasCustomGeminiApiKey,
  removeUserGeminiApiKey,
  saveUserGeminiApiKey,
} from "@/lib/settings/user-settings"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hasCustomKey = await hasCustomGeminiApiKey(userId)
  return Response.json({ hasCustomKey })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { apiKey?: string }
  const apiKey = body.apiKey?.trim()

  if (!apiKey) {
    return Response.json({ error: "API key is required" }, { status: 400 })
  }

  try {
    await saveUserGeminiApiKey(userId, apiKey)
    return Response.json({ ok: true, hasCustomKey: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save API key"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  await removeUserGeminiApiKey(userId)
  return Response.json({ ok: true, hasCustomKey: false })
}
