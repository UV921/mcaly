import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Next.js 16 uses proxy.ts (not middleware.ts) for request interception.
// Clerk auth runs here before pages/API routes load.
const isProtected = createRouteMatcher(["/dashboard(.*)", "/onboarding"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
