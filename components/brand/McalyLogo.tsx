import { cn } from "@/lib/utils"

// Brand colors — M = Mail (gold), c = Calendar (teal). Matches globals.css.
const MAIL = "#C4A035"
const CALENDAR = "#4A9EB0"
const MUTED = "currentColor"

interface McalyLogoProps {
  className?: string
  /** full = icon + wordmark, wordmark = text only, icon = mark only */
  variant?: "full" | "wordmark" | "icon"
}

/** Mcaly logo — M highlights Mail, c highlights Calendar. */
export function McalyLogo({ className, variant = "full" }: McalyLogoProps) {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-10 w-10", className)}
        aria-hidden
      >
        <rect
          width="48"
          height="48"
          rx="14"
          className="fill-primary/15 stroke-primary/25"
          strokeWidth="1"
        />
        {/* M — mail */}
        <path
          d="M11 32V16l6.5 8.5L24 16l6.5 8.5L37 16v16"
          stroke={MAIL}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* c — calendar arc tucked into lower-right */}
        <path
          d="M30 28a6 6 0 1 1 0 12"
          stroke={CALENDAR}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }

  if (variant === "wordmark") {
    return (
      <svg
        viewBox="0 0 160 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-10 w-auto", className)}
        role="img"
        aria-label="Mcaly"
      >
        <text
          x="0"
          y="38"
          fontFamily="var(--font-serif), Georgia, serif"
          fontSize="42"
          fontWeight="600"
          letterSpacing="-0.02em"
        >
          <tspan fill={MAIL}>M</tspan>
          <tspan fill={CALENDAR}>c</tspan>
          <tspan fill={MUTED} opacity="0.85">
            aly
          </tspan>
        </text>
      </svg>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <McalyLogo variant="icon" />
      <McalyLogo variant="wordmark" className="h-9" />
    </div>
  )
}

/** Small legend for auth page — explains M and c. */
export function McalyLogoLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-4 text-sm text-muted-foreground", className)}>
      <span className="flex items-center gap-2">
        <span className="font-serif text-base font-semibold" style={{ color: MAIL }}>
          M
        </span>
        Mail
      </span>
      <span className="flex items-center gap-2">
        <span className="font-serif text-base font-semibold" style={{ color: CALENDAR }}>
          c
        </span>
        Calendar
      </span>
    </div>
  )
}
