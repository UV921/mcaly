# Mcaly

**Autopilot for your inbox and calendar.**

Mcaly is an AI-first email and calendar workspace built with [Next.js](https://nextjs.org), [Clerk](https://clerk.com), [Corsair](https://corsair.dev), and [Google Gemini](https://ai.google.dev). It helps you prioritize your day, read and reply to email, view meetings, and ask an AI agent to take action on your behalf.

**Repository:** [github.com/UV921/mcaly](https://github.com/UV921/mcaly)  
**Version:** `0.1.0`

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local development setup](#local-development-setup)
- [OAuth & connections](#oauth--connections)
- [How the app works](#how-the-app-works)
- [Ask Mcaly agent](#ask-mcaly-agent)
- [Deployment](#deployment)
- [Google OAuth verification](#google-oauth-verification)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Features

### Dashboard
- **Today focus** — ranks today's meetings and important emails into two calm buckets: *can't skip* and *worth a look*.
- **Suggested actions** — quick prompts to jump into Ask Mcaly.
- **Ask Mcaly bar** — command bar on every dashboard page.

### Inbox
- Fetches up to 20 inbox messages per user.
- **Priority sorting** — `need-action`, `important`, `low-priority` (rule-based classification).
- **Email detail drawer** — full body, sanitized HTML rendering, AI summary, suggested reply, and action line.
- **Cold-start sync** — first visit pulls from Gmail API and caches to Corsair's local DB; later visits read from DB (fast, no repeated API calls).

### Calendar
- Week view with day picker.
- Meetings from Google Calendar (primary calendar).
- Shows title, time, attendees, location, Google Meet link, and link to open in Google Calendar.

### Ask Mcaly (AI agent)
- Streaming chat powered by **Gemini 2.5 Flash Lite** via the Vercel AI SDK.
- Can **read inbox**, **draft and send email replies**, and **schedule calendar meetings**.
- Uses **Corsair MCP tools** (`list_operations`, `get_schema`, `run_script`, `corsair_setup`) plus a dedicated `schedule_meeting` tool for reliable calendar booking.
- Shows a friendly **agent activity timeline** and **completion cards** when an email is sent or a meeting is scheduled.

### Auth & onboarding
- Sign in / sign up with **Clerk**.
- Guided onboarding to connect **Gmail** and **Google Calendar** via OAuth.
- Per-user tenant isolation — each Clerk `userId` maps to a Corsair tenant.

### UI
- Light / dark theme.
- Responsive sidebar (collapsible, mobile drawer).
- Landing page with product overview.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Auth | Clerk |
| Integrations | Corsair (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, `@corsair-dev/mcp`) |
| Database | PostgreSQL (Neon recommended) via `pg` |
| ORM / schema | Drizzle (Corsair table definitions) |
| AI | Vercel AI SDK + `@ai-sdk/google` (Gemini) |
| Package manager | Bun (npm/pnpm/yarn also work) |

---

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    Landing[Landing page]
    Dashboard[Dashboard / Inbox / Calendar]
    AskChat[Ask Mcaly chat]
  end

  subgraph next [Next.js server]
    ClerkMW[proxy.ts — Clerk auth]
    Pages[Server components]
    API[API routes]
    Actions[Server actions]
    Agent["/api/ask — streamText agent"]
  end

  subgraph external [External services]
    Clerk[Clerk auth]
    Gemini[Google Gemini API]
    Gmail[Gmail API]
    GCal[Google Calendar API]
  end

  subgraph data [Data layer]
    PG[(PostgreSQL)]
    Corsair[Corsair SDK]
  end

  Landing --> ClerkMW
  Dashboard --> ClerkMW
  AskChat --> API
  ClerkMW --> Pages
  ClerkMW --> API
  Pages --> Corsair
  Actions --> Corsair
  API --> Agent
  Agent --> Gemini
  Agent --> Corsair
  Corsair --> PG
  Corsair --> Gmail
  Corsair --> GCal
  Pages --> Clerk
```

### Separation of concerns

Mcaly follows a clear layering pattern:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Pages** | `app/` | Compose UI, fetch data, no business logic |
| **Components** | `components/` | Presentational UI |
| **Data** | `lib/calendar/`, `lib/dashboard/get-emails.ts` | Fetch from Corsair / Google APIs |
| **Logic** | `lib/dashboard/get-today-focus.ts`, `lib/email/email-classify.ts` | Rank, classify, score |
| **AI** | `lib/ai/`, `app/api/ask/` | Summaries, agent tools, streaming chat |
| **Integrations** | `lib/corsair.ts`, `app/api/connect/`, `app/api/auth/` | OAuth, tenant-scoped Corsair instance |

---

## Project structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── ask/route.ts          # Ask Mcaly agent (streaming)
│   │   ├── auth/route.ts         # Google OAuth callback
│   │   └── connect/route.ts      # Start OAuth flow
│   ├── dashboard/
│   │   ├── page.tsx              # Today focus home
│   │   ├── inbox/page.tsx        # Priority inbox
│   │   ├── inbox/actions.ts      # Server actions (email detail, AI summary)
│   │   ├── calendar/page.tsx     # Week calendar view
│   │   ├── ask/page.tsx          # Full Ask Mcaly chat
│   │   └── layout.tsx            # Sidebar shell
│   ├── onboarding/page.tsx       # Connect Gmail + Calendar
│   ├── sign-in/ / sign-up/       # Clerk auth pages
│   ├── page.tsx                  # Landing page
│   └── layout.tsx                # Root layout (Clerk, theme, fonts)
├── components/
│   ├── dashboard/                  # Sidebar, inbox, agent UI, focus cards
│   ├── calendar/                   # CalendarView, MeetingRow
│   ├── landing/                    # Marketing sections
│   ├── onboarding/                 # Setup steps
│   └── ui/                         # shadcn primitives
├── lib/
│   ├── ai/
│   │   ├── mcaly-tools.ts          # Corsair MCP + schedule_meeting tools
│   │   ├── schedule-meeting.ts     # Typed Google Calendar create wrapper
│   │   ├── parse-agent-outcomes.ts # Email sent / meeting scheduled cards
│   │   └── summarise-email.ts      # Gemini email summary
│   ├── calendar/
│   │   ├── getEventsInRange.ts     # Core calendar fetch
│   │   └── getTodayMeetings.ts     # Today / this-week helpers
│   ├── dashboard/
│   │   ├── get-emails.ts           # Inbox fetch + DB sync
│   │   └── get-today-focus.ts      # Dashboard ranking logic
│   ├── email/email-classify.ts     # Rule-based priority
│   ├── db/schema.ts                # Corsair Postgres tables
│   ├── corsair.ts                  # Corsair instance (Gmail + Calendar)
│   ├── connections.ts              # Connection status checks
│   └── version.ts                  # App version from package.json
├── proxy.ts                        # Clerk middleware (Next.js 16)
├── drizzle.config.ts
└── package.json
```

---

## Prerequisites

Before running Mcaly locally, you need:

1. **Node.js 20+** or **Bun**
2. **PostgreSQL database** — [Neon](https://neon.tech) works well
3. **Clerk application** — [clerk.com](https://clerk.com)
4. **Google Cloud project** with:
   - Gmail API enabled
   - Google Calendar API enabled
   - OAuth 2.0 credentials (Web application)
5. **Google AI API key** — for Gemini ([aistudio.google.com](https://aistudio.google.com))
6. **Corsair CLI** — for initial integration setup (`@corsair-dev/cli`)

---

## Environment variables

Create `.env.local` in the project root (never commit this file):

```bash
# App
APP_URL=http://localhost:3000

# Database (PostgreSQL connection string)
DB_URI=postgresql://user:password@host/dbname?sslmode=require

# Corsair encryption key (generate a strong random string)
CORSAIR_KEK=your-32-char-or-longer-secret-key

# Clerk (from Clerk Dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Gemini (from Google AI Studio)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes | Public base URL of the app. Used for OAuth redirect (`{APP_URL}/api/auth`). |
| `DB_URI` | Yes | PostgreSQL connection string. Stores Corsair integrations, accounts, encrypted tokens, and synced email entities. |
| `CORSAIR_KEK` | Yes | Key encryption key for Corsair credential storage. Keep secret and stable across deploys. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (client-safe). |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server only). |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Powers email summaries and the Ask Mcaly agent. |

> **Note:** Gmail and Google Calendar OAuth client ID/secret are **not** stored in `.env`. They are configured in the database via `npx corsair setup` (see below).

---

## Local development setup

### 1. Clone and install

```bash
git clone https://github.com/UV921/mcaly.git
cd mcaly
bun install
# or: npm install
```

### 2. Configure environment

Copy the variables above into `.env.local` and fill in your values.

### 3. Set up Corsair (Gmail + Calendar credentials)

Corsair stores Google OAuth app credentials in Postgres. Run the interactive setup:

```bash
npx corsair setup
```

Follow the prompts to:
- Point at your `DB_URI`
- Configure the **Gmail** plugin (OAuth client ID, client secret, scopes)
- Configure the **Google Calendar** plugin

This creates rows in `corsair_integrations` and prepares the DB for multi-tenant accounts.

### 4. Google Cloud OAuth redirect URI

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth client, add:

| Environment | Authorized redirect URI |
|-------------|-------------------------|
| Local | `http://localhost:3000/api/auth` |
| Production | `https://your-domain.com/api/auth` |

### 5. Clerk configuration

In the [Clerk Dashboard](https://dashboard.clerk.com):

- Set **Sign-in URL** to `/sign-in`
- Set **Sign-up URL** to `/sign-up`
- After sign-in redirect: `/onboarding`
- Add your local and production domains under **Domains**

### 6. Run the dev server

```bash
bun dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. First-time user flow

1. Sign up / sign in with Clerk
2. Complete onboarding — connect Gmail, then Google Calendar
3. Land on the dashboard with today focus, inbox, and calendar populated

---

## OAuth & connections

### Connect flow

```
User clicks "Connect Gmail"
  → GET /api/connect?plugin=gmail
  → generateOAuthUrl(corsair, plugin, { tenantId: userId })
  → Redirect to Google consent screen
  → Google redirects to /api/auth?code=...&state=...
  → processOAuthCallback(corsair, { code, state })
  → Refresh token stored per tenant in Postgres
  → Redirect to /onboarding
```

Supported `plugin` values:
- `gmail`
- `googlecalendar`

### Connection status

`lib/connections.ts` checks for a stored refresh token per plugin. No network call to Google — fast local lookup.

Users can reconnect anytime from the **sidebar** connection links.

### Multi-tenancy

Corsair is configured with `multiTenancy: true`. Every Clerk `userId` becomes a tenant:

```typescript
const tenant = corsair.withTenant(userId)
await tenant.gmail.api.messages.send(...)
await tenant.googlecalendar.api.events.create(...)
```

This ensures users never share OAuth tokens or synced data.

---

## How the app works

### Inbox sync strategy

`lib/dashboard/get-emails.ts` uses a two-phase approach:

1. **DB first** — `tenant.gmail.db.messages.search({ limit: 20 })`  
   If messages exist for this tenant, return immediately (no Gmail API call).

2. **Cold start** — If the DB is empty:
   - `messages.list({ q: "in:inbox", maxResults: 20 })`
   - `messages.get({ format: "full" })` per message
   - `upsertByEntityId` into Corsair DB (subject, from, to, snippet, body, payload)
   - Return classified inbox emails

**Trade-off:** After the first sync, new mail won't appear until you add refresh logic (manual refresh button, webhooks, or TTL re-fetch). This is not yet implemented.

### Email priority classification

`lib/email/email-classify.ts` uses rules (no AI):
- **low-priority** — Gmail `CATEGORY_PROMOTION` or `CATEGORY_SOCIAL` labels
- **need-action** — keywords like meeting, deadline, urgent, reply, approval
- **important** — everything else

### Dashboard ranking

`lib/dashboard/get-today-focus.ts` scores meetings and emails, then splits into:
- **can't skip** — score ≥ 90 (meetings within 1 hour, need-action emails)
- **worth a look** — everything else ranked

### Email AI summary

When a user opens an email in the inbox drawer, `summariseEmail()` calls Gemini to return:
- Short summary
- Suggested action
- Draft reply
- Priority label

---

## Ask Mcaly agent

### Endpoint

`POST /api/ask` — streaming UI message response (Vercel AI SDK).

### Model

`google("gemini-2.5-flash-lite")` — cost-efficient, good for tool-calling loops.

### Tools available to the agent

| Tool | Source | Purpose |
|------|--------|---------|
| `corsair_setup` | Corsair MCP | Check if Gmail/Calendar are connected |
| `list_operations` | Corsair MCP | Discover all plugin API paths |
| `get_schema` | Corsair MCP | Inspect input/output schema for an operation |
| `run_script` | Corsair MCP | Execute JS with `corsair` in scope |
| `schedule_meeting` | Mcaly custom | Create calendar events with correct timezone handling |

### Why both Corsair tools and `schedule_meeting`?

Corsair MCP exposes **meta-tools**, not one tool per API endpoint. The agent discovers endpoints via `list_operations` and calls them through `run_script`. That works for flexible tasks but the LLM often builds incorrect Calendar payloads (causing Google **Bad Request** errors).

`schedule_meeting` is a typed wrapper around `googlecalendar.api.events.create` so the model only supplies human-friendly fields (year, month, day, hour, attendees) and Mcaly builds the correct API body.

### Example agent prompts

```
Summarize my last 5 emails
```

```
Draft a reply to the email from John about the project deadline
```

```
Schedule a meeting titled "Mcaly sync" on June 19, 2026 at 11 PM IST for 1 hour with teammate@company.com
```

### Agent UI

- **AgentActivityTimeline** — friendly labels for tool steps
- **AgentOutcomeCards** — completion cards for sent emails and scheduled meetings

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set all environment variables (use production values)
4. Set `APP_URL` to your production URL (e.g. `https://mcaly.yourdomain.com`)
5. Deploy

### Custom domain (e.g. Hostinger)

1. In Vercel → Project → Domains, add your domain
2. At your DNS provider (Hostinger), add the records Vercel shows (usually a CNAME or A record)
3. Update Clerk allowed domains to include your production URL
4. Add production redirect URI in Google Cloud: `https://your-domain.com/api/auth`
5. Re-run or verify `npx corsair setup` against your production `DB_URI` if using a separate prod database

### Production checklist

- [ ] All env vars set in Vercel
- [ ] `APP_URL` matches production domain
- [ ] Google OAuth redirect URI includes production URL
- [ ] Clerk production keys and domain configured
- [ ] `CORSAIR_KEK` is stable (do not rotate without a migration plan)
- [ ] PostgreSQL accessible from Vercel (Neon works out of the box)

---

## Google OAuth verification

For **personal / testing** use, keep your Google Cloud OAuth app in **Testing** mode. Up to 100 test users can connect without full verification.

For a **public launch**, Google requires [OAuth verification](https://support.google.com/cloud/answer/9110914) for restricted scopes (Gmail read/send, Calendar read/write). Plan for:
- Privacy policy URL
- Terms of service
- Demo video
- Scope justification

---

## Scripts

```bash
bun dev          # Start development server
bun run build    # Production build
bun start        # Start production server
bun run lint     # ESLint
```

### Database (optional)

Drizzle is configured for Corsair table definitions:

```bash
npx drizzle-kit push   # Push schema to DB (if needed)
```

Corsair manages its own tables during `npx corsair setup`; you typically do not need manual migrations for the integration layer.

---

## Troubleshooting

### Inbox is empty after connecting Gmail

- First visit triggers a Gmail API sync. Wait a few seconds and refresh.
- If still empty, check that Gmail OAuth completed (sidebar shows Gmail connected).
- Check server logs for Gmail API errors.

### Ask Mcaly says calendar is not supported

- Ensure Google Calendar is connected in the sidebar.
- Restart the dev server after code updates.
- The agent should use `schedule_meeting` for booking — not claim calendar is unavailable.

### Bad Request when scheduling a meeting

- Confirm Calendar is connected (`/api/connect?plugin=googlecalendar`).
- Provide clear date, time (24h), timezone (IST = `Asia/Kolkata`), duration, and attendee email.
- Check that `APP_URL` and OAuth redirect URIs are correct.

### OAuth redirect mismatch

Google error `redirect_uri_mismatch` means the redirect URI in Google Cloud does not exactly match `{APP_URL}/api/auth`.

### Clerk auth errors

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match your Clerk app.
- Add your domain to Clerk's allowed domains list.

### Database connection errors

- Confirm `DB_URI` is correct and the database accepts connections from your environment.
- Ensure `npx corsair setup` has been run against the same database.

---

## Security notes

- Never commit `.env`, `.env.local`, or secrets to git.
- Rotate any keys that were accidentally exposed.
- `CORSAIR_KEK` encrypts stored OAuth tokens — keep it secret and consistent.
- Clerk protects `/dashboard` and `/onboarding` routes via `proxy.ts`.
- OAuth state is stored in an httpOnly cookie with a 10-minute TTL.

---

## License

Private project — see repository owner for licensing terms.

---

## Acknowledgements

Built with [Corsair](https://corsair.dev) for Gmail and Google Calendar integrations, [Clerk](https://clerk.com) for authentication, and [Google Gemini](https://ai.google.dev) for AI features.
