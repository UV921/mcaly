"use client"

// Dashboard sidebar, built on the shadcn Sidebar primitive (components/ui/sidebar).
// Building on the primitive gives us, for free:
//   - open/close (the SidebarTrigger button in the layout, or Ctrl/Cmd+B)
//   - collapse-to-icons mode (collapsible="icon")
//   - a mobile drawer on small screens
//   - state persistence via a cookie
//
// We only describe WHAT goes in the sidebar (brand, nav links, user card); the
// primitive handles all the open/close behaviour.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react"
import { McalyLogo } from "@/components/brand/McalyLogo"
import { LogoutButton } from "@/components/logout-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"
import type { ConnectionStatus } from "@/lib/connections"

// Account connections. `key` lines up with the ConnectionStatus flags so we can
// show whether each one is connected. These are plain API links (not <Link>)
// because they trigger a full-page redirect into Google's OAuth flow.
const connections = [
  { key: "gmail", label: "Gmail", icon: Mail, href: "/api/connect?plugin=gmail" },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    href: "/api/connect?plugin=googlecalendar",
  },
] as const

// Navigation links. Add/remove here and the list re-renders automatically.
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inbox", icon: Inbox, href: "/dashboard/inbox" },
  { label: "Calendar", icon: CalendarDays, href: "/dashboard/calendar" },
  { label: "Ask Mcaly", icon: Sparkles, href: "/dashboard/ask" },
  { label: "Action", icon: Zap, href: "/dashboard/action" },
  { label: "Settings", icon: Settings2, href: "/dashboard/settings" },
]

export function AppSidebar({ connections: status }: { connections: ConnectionStatus }) {
  // Current path — used to highlight the active nav item.
  const pathname = usePathname()
  // The signed-in Clerk user (null until loaded). Gives us their real name,
  // email and photo so the sidebar matches who's actually logged in.
  const { user } = useUser()

  return (
    // collapsible="icon" => shrinks to an icon rail instead of disappearing.
    // variant="floating"  => keeps your rounded "floating card" look.
    <Sidebar collapsible="icon" variant="floating">
      {/* Brand */}
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center px-1 py-2">
          <McalyLogo variant="full" className="group-data-[collapsible=icon]:hidden" />
          <McalyLogo
            variant="icon"
            className="hidden group-data-[collapsible=icon]:flex"
          />
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Connect your Google accounts */}
        <SidebarGroup>
          <SidebarGroupLabel>Connections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {connections.map((item) => {
                const Icon = item.icon
                const connected = status[item.key]
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild>
                      {/* Plain <a>: OAuth needs a real navigation, not client routing */}
                      <a href={item.href}>
                        <Icon />
                        {/* Connected => just the name; otherwise prompt to connect */}
                        <span>{connected ? item.label : `Connect ${item.label}`}</span>
                        {/* Status dot: green when connected, grey when not */}
                        <span
                          className={cn(
                            "ml-auto h-2 w-2 shrink-0 rounded-full",
                            connected ? "bg-chart-2" : "bg-muted-foreground/40"
                          )}
                          title={connected ? "Connected" : "Not connected"}
                        />
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User card + explicit log out */}
      <SidebarFooter>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.fullName ?? user?.username ?? "Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
              </p>
            </div>
          </div>
          <LogoutButton
            variant="outline"
            className="group-data-[collapsible=icon]:hidden"
          />
          <LogoutButton
            iconOnly
            variant="outline"
            className="hidden w-full group-data-[collapsible=icon]:flex"
            showIcon
          />
          <p className="text-center text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            Mcaly v{APP_VERSION}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
