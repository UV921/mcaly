"use client"

import { SignIn } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { AuthShell } from "@/components/auth/AuthShell"
import { getAuthPageAppearance } from "@/lib/clerk-appearance"

export default function SignInPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const appearance = getAuthPageAppearance(mounted && resolvedTheme === "dark")

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to connect Gmail, Calendar, and Ask Mcaly."
    >
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/onboarding"
        appearance={appearance}
      />
    </AuthShell>
  )
}
