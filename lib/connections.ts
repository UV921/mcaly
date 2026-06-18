// DATA LAYER — account connection status.
//
// Tells us whether the signed-in user has connected Gmail / Google Calendar.
// We check for a stored refresh token (set during the OAuth connect flow):
//   - token present  => connected
//   - null / throws  => not connected
// This is a fast local credential lookup — no network call to Google.

import { corsair } from "./corsair"
import { auth } from "@clerk/nextjs/server"

export interface ConnectionStatus {
  gmail: boolean
  calendar: boolean
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const { userId } = await auth()
  if (!userId) return { gmail: false, calendar: false }

  const tenant = corsair.withTenant(userId)

  // Wrap each lookup so a missing-account error just means "not connected".
  const isConnected = async (
    getRefreshToken: () => Promise<string | null>
  ): Promise<boolean> => {
    try {
      return Boolean(await getRefreshToken())
    } catch {
      return false
    }
  }

  const [gmail, calendar] = await Promise.all([
    isConnected(() => tenant.gmail.keys.get_refresh_token()),
    isConnected(() => tenant.googlecalendar.keys.get_refresh_token()),
  ])

  return { gmail, calendar }
}
