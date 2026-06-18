// Dashboard layout. Wraps every /dashboard route in the shadcn SidebarProvider
// so the sidebar's open/close state (and cookie persistence) works app-wide.
//
//   SidebarProvider  -> holds open/closed state + keyboard shortcut
//   AppSidebar       -> our nav (built on the primitive)
//   SidebarInset     -> the main content area next to the sidebar
//   SidebarTrigger   -> the button that toggles the sidebar open/closed

import { ReactNode } from "react"
import { AppSidebar } from "@/components/dashboard/Sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { getConnectionStatus } from "@/lib/connections"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  // Fetch Gmail/Calendar connection status on the server, then hand it to the
  // sidebar (a client component) as props.
  const connections = await getConnectionStatus()

  return (
    <SidebarProvider>
      <AppSidebar connections={connections} />

      <SidebarInset className="bg-background">
        {/* Top bar with the open/close toggle */}
        <header className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 pb-6 sm:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
