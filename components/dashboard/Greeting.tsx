// Friendly greeting headline at the top of the dashboard.
// Fetches the signed-in Clerk user on each request (server component).

import { currentUser } from "@clerk/nextjs/server"

function greetingName(
  user: Awaited<ReturnType<typeof currentUser>>
): string {
  if (!user) return "there"
  if (user.firstName?.trim()) return user.firstName.trim()
  if (user.fullName?.trim()) {
    return user.fullName.trim().split(/\s+/)[0] ?? user.fullName
  }
  if (user.username?.trim()) return user.username.trim()
  const email = user.primaryEmailAddress?.emailAddress
  if (email) return email.split("@")[0] ?? "there"
  return "there"
}

export async function Greeting() {
  const user = await currentUser()
  const name = greetingName(user)

  return (
    <div className="px-1">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Hey {name}, here&apos;s what matters for you!
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        A quick look at the emails and meetings that need your attention today.
      </p>
    </div>
  )
}
