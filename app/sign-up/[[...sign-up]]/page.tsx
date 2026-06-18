"use client"

import { SignUp } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { AuthShell } from "@/components/auth/AuthShell"
import { getAuthPageAppearance } from "@/lib/clerk-appearance"

export default function SignUpPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const appearance = getAuthPageAppearance(mounted && resolvedTheme === "dark")

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start free — connect Gmail and Calendar in the next step."
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
        appearance={appearance}
      />
    </AuthShell>
  )
}
