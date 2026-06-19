import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { ensureUserSettingsTable } from "@/lib/db/ensure-user-settings"
import { userSettings } from "@/lib/db/schema"
import { decryptSecret, encryptSecret } from "@/lib/crypto/encrypt"

let tableReady: Promise<void> | null = null

function ensureTable() {
  if (!tableReady) {
    tableReady = ensureUserSettingsTable()
  }
  return tableReady
}

export async function hasCustomGeminiApiKey(userId: string): Promise<boolean> {
  await ensureTable()

  const rows = await db
    .select({ geminiApiKeyEncrypted: userSettings.geminiApiKeyEncrypted })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  return Boolean(rows[0]?.geminiApiKeyEncrypted)
}

export async function getUserGeminiApiKey(userId: string): Promise<string | null> {
  await ensureTable()

  const rows = await db
    .select({ geminiApiKeyEncrypted: userSettings.geminiApiKeyEncrypted })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  const encrypted = rows[0]?.geminiApiKeyEncrypted
  if (!encrypted) return null

  try {
    return decryptSecret(encrypted)
  } catch {
    return null
  }
}

export async function saveUserGeminiApiKey(
  userId: string,
  apiKey: string
): Promise<void> {
  await ensureTable()

  const trimmed = apiKey.trim()
  if (!trimmed) {
    throw new Error("API key is required")
  }

  const encrypted = encryptSecret(trimmed)
  const now = new Date()

  await db
    .insert(userSettings)
    .values({
      userId,
      geminiApiKeyEncrypted: encrypted,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        geminiApiKeyEncrypted: encrypted,
        updatedAt: now,
      },
    })
}

export async function removeUserGeminiApiKey(userId: string): Promise<void> {
  await ensureTable()

  await db
    .update(userSettings)
    .set({
      geminiApiKeyEncrypted: null,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId))
}
