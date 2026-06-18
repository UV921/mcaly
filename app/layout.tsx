import type { Metadata } from "next"
import { Playfair_Display, Poppins } from "next/font/google"
import { BrandedClerkProvider } from "@/components/branded-clerk-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Mcaly — Autopilot for your inbox",
  description:
    "AI-first email and calendar workspace. Prioritize your day, ask Mcaly to reply and schedule.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", poppins.variable, playfair.variable)}
    >
      <body>
        <ThemeProvider>
          <BrandedClerkProvider>{children}</BrandedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
