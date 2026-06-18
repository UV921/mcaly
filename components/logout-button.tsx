"use client"

import { SignOutButton } from "@clerk/nextjs"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  className?: string
  /** Sidebar collapsed mode — icon only */
  iconOnly?: boolean
}

export function LogoutButton({
  variant = "ghost",
  size = "sm",
  showIcon = true,
  className,
  iconOnly = false,
}: LogoutButtonProps) {
  return (
    <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : size}
        className={cn(
          iconOnly ? "rounded-xl" : "w-full justify-start gap-2 rounded-xl",
          className
        )}
      >
        {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
        {!iconOnly && <span>Log out</span>}
      </Button>
    </SignOutButton>
  )
}
