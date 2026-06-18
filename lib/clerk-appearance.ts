// Mcaly brand colors — matched to globals.css tokens.

type ClerkAppearance = {
  variables: Record<string, string>
  elements?: Record<string, string>
  layout?: Record<string, string | boolean>
}
const light = {
  colorPrimary: "#C4A035",
  colorPrimaryForeground: "#1a1a1a",
  colorBackground: "#FAF7F0",
  colorInputBackground: "#F5F2EA",
  colorInputText: "#1a1a1a",
  colorText: "#1a1a1a",
  colorTextSecondary: "#6b6b6b",
  colorNeutral: "#E8E4DA",
  colorDanger: "#dc4a4a",
  borderRadius: "1rem",
} as const

const dark = {
  colorPrimary: "#E0B840",
  colorPrimaryForeground: "#141414",
  colorBackground: "#141414",
  colorInputBackground: "#222222",
  colorInputText: "#f5f5f5",
  colorText: "#f5f5f5",
  colorTextSecondary: "#a3a3a3",
  colorNeutral: "#2a2a2a",
  colorDanger: "#f87171",
  borderRadius: "1rem",
} as const

const sharedElements: ClerkAppearance["elements"] = {
  rootBox: "font-sans",
  card: "rounded-[28px] border border-border shadow-2xl shadow-primary/5",
  headerTitle: "font-serif text-2xl font-semibold tracking-tight",
  headerSubtitle: "text-muted-foreground",
  socialButtonsBlockButton:
    "rounded-2xl border border-border bg-background hover:bg-muted/60",
  formButtonPrimary:
    "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  formFieldInput:
    "rounded-2xl border-border bg-input focus:ring-2 focus:ring-primary/30",
  footerActionLink: "text-primary hover:text-primary/80",
  identityPreviewEditButton: "text-primary",
  formFieldAction: "text-primary",
  dividerLine: "bg-border",
  dividerText: "text-muted-foreground",
  navbarButton: "text-foreground hover:bg-muted",
  profileSectionPrimaryButton: "text-primary",
  badge: "rounded-full",
  menuList: "rounded-2xl border border-border",
  menuItem: "rounded-xl",
}

const sharedLayout: ClerkAppearance["layout"] = {
  socialButtonsPlacement: "bottom",
  socialButtonsVariant: "blockButton",
  showOptionalFields: false,
}

/** Clerk appearance for light or dark — matches Mcaly gold/cream branding. */
export function getClerkAppearance(isDark: boolean): ClerkAppearance {
  return {
    variables: isDark ? dark : light,
    elements: sharedElements,
    layout: {
      ...sharedLayout,
    },
  }
}

/** Auth pages use our split layout — strip Clerk card chrome. */
export function getAuthPageAppearance(isDark: boolean): ClerkAppearance {
  const base = getClerkAppearance(isDark)
  return {
    ...base,
    elements: {
      ...base.elements,
      rootBox: "w-full mx-auto",
      cardBox: "w-full shadow-none",
      card: "shadow-none border-0 bg-transparent p-0 gap-6",
      header: "hidden",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      logoBox: "hidden",
      footer: "bg-transparent",
    },
  }
}
