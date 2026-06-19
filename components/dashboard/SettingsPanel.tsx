"use client"

import { useEffect, useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LogoutButton } from "@/components/logout-button"

interface ApiKeySettingsProps {
  initialHasCustomKey: boolean
}

export function ApiKeySettings({ initialHasCustomKey }: ApiKeySettingsProps) {
  const [hasCustomKey, setHasCustomKey] = useState(initialHasCustomKey)
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setHasCustomKey(initialHasCustomKey)
  }, [initialHasCustomKey])

  async function saveKey() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })
      const data = (await res.json()) as { error?: string; hasCustomKey?: boolean }

      if (!res.ok) {
        setError(data.error ?? "Failed to save API key")
        return
      }

      setHasCustomKey(Boolean(data.hasCustomKey))
      setApiKey("")
      setMessage("Your Gemini API key is saved. Ask Mcaly will use it for AI requests.")
    } catch {
      setError("Failed to save API key")
    } finally {
      setSaving(false)
    }
  }

  async function removeKey() {
    setRemoving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch("/api/settings/api-key", { method: "DELETE" })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Failed to remove API key")
        return
      }

      setHasCustomKey(false)
      setApiKey("")
      setMessage("Removed your API key. Mcaly's shared key will be used (with rate limits).")
    } catch {
      setError("Failed to remove API key")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Card className="rounded-[32px] border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" />
          Google AI API key
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mcaly&apos;s shared Gemini key has rate limits. Add your own key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Google AI Studio
          </a>{" "}
          for unlimited personal use.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {hasCustomKey
            ? "You're using your own API key for Ask Mcaly."
            : "You're on Mcaly's shared API key (rate limited)."}
        </div>

        <div className="space-y-2">
          <label htmlFor="gemini-api-key" className="text-sm font-medium text-foreground">
            Gemini API key
          </label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder={hasCustomKey ? "Enter a new key to replace the saved one" : "AIza..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </div>

        {message && <p className="text-sm text-primary">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={saveKey}
            disabled={saving || !apiKey.trim()}
            className="rounded-full"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : hasCustomKey ? (
              "Update key"
            ) : (
              "Save key"
            )}
          </Button>

          {hasCustomKey && (
            <Button
              type="button"
              variant="outline"
              onClick={removeKey}
              disabled={removing}
              className="rounded-full"
            >
              {removing ? "Removing…" : "Remove key"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AccountSettings() {
  return (
    <Card className="rounded-[32px] border border-border">
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign out of Mcaly on this device.
        </p>
      </CardHeader>
      <CardContent>
        <LogoutButton variant="outline" className="rounded-full" />
      </CardContent>
    </Card>
  )
}
