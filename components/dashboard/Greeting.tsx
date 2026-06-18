// Friendly greeting headline shown at the top of the dashboard.
// The user's name is hard-coded fake data for now; later it can come
// from the logged-in account.

const userName = "Uvesh"

export function Greeting() {
  return (
    <div className="px-1">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Hey {userName}, here&apos;s what matters for you
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        A quick look at the emails and meetings that need your attention today.
      </p>
    </div>
  )
}
