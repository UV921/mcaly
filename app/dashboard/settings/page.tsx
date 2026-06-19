import { AccountSettings, ApiKeySettings } from "@/components/dashboard/SettingsPanel"
import { hasCustomGeminiApiKey } from "@/lib/settings/user-settings"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const { userId } = await auth()
  const hasCustomKey = userId ? await hasCustomGeminiApiKey(userId) : false

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and AI preferences.
        </p>
      </div>

      <ApiKeySettings initialHasCustomKey={hasCustomKey} />
      <AccountSettings />
    </div>
  )
}
