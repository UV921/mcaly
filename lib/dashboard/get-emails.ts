// Get the signed-in user's emails for the inbox.
//
// 1. Read from Corsair local DB when already synced (fast, no API calls).
// 2. On first load, fetch from Gmail (full message), sync to DB, then serve.
//    Later visits for the same user hit the DB only.

import { corsair } from "../corsair";
import { auth } from "@clerk/nextjs/server";
import { classifyEmail, type EmailPriority } from "../email/email-classify";

const INBOX_LIMIT = 20;

export type InboxEmail = {
  id?: string;
  subject?: string;
  from?: string;
  snippet?: string;
  date: number;
  priority: EmailPriority;
};

// Shape of a single email's full detail (used by the click-to-open drawer).
export interface EmailDetail {
  id?: string;
  threadId?: string;
  subject?: string;
  snippet?: string;
  from?: string;
  to?: string;
  date: number;
  priority: EmailPriority;
  // Plain-text version (good for AI + a safe fallback).
  body: string;
  // Sanitized HTML version (so we can render formatting + clickable links).
  html: string;
}

// A Gmail message "part" can contain a body OR nest more parts inside it.
// This minimal shape is all we need to dig out the text.
type MessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
};

// Decode Gmail's base64url-encoded body data into a normal string.
function decode(data?: string): string {
  return data ? Buffer.from(data, "base64url").toString("utf-8") : "";
}

// Turn an HTML email into readable plain text. HTML emails are full of tags,
// styles, and invisible spacer characters — without this you'd see a wall of
// "<div>", "&nbsp;", etc. in the drawer.
function htmlToText(html: string): string {
  return html
    // Drop non-visible blocks entirely.
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    // Turn line-breaking tags into actual newlines.
    .replace(/<\/?(br|p|div|tr|li|h[1-6])[^>]*>/gi, "\n")
    // Remove every remaining tag.
    .replace(/<[^>]+>/g, "")
    // Decode the most common HTML entities.
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Strip zero-width / spacer characters newsletters love to use.
    .replace(/[\u200B-\u200D\u00AD\u034F\uFEFF]/g, "")
    // Tidy up whitespace.
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Make raw email HTML safe AND clean to render in our app.
//
// Email HTML is messy: it's built from big nested <table> layouts, inline
// style="" everywhere, fixed widths and background colors. If we render that
// as-is it looks broken and fights our design. So here we:
//   1. remove dangerous/invisible bits (scripts, styles, comments),
//   2. strip the email's own styling (style/class/width/bgcolor/etc.),
//   3. unwrap layout tables so content flows normally,
//   4. keep the meaningful tags (p, a, h1-6, ul/li, img, br, hr, strong/em),
//   5. make links open safely in a new tab.
// The result inherits OUR clean styling from the drawer.
// NOTE: this is a lightweight cleaner — fine for trusted personal email in a
// hackathon. For production you'd use a vetted library like DOMPurify.
function sanitizeHtml(html: string): string {
  return (
    html
      // 1) Remove dangerous / non-visible blocks and comments.
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove inline event handlers (onclick=, onload=, ...) and js: URLs.
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
      .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
      .replace(/javascript:/gi, "")
      // 2) Strip the email's own styling/layout attributes so it inherits ours.
      .replace(/\s(style|class|width|height|bgcolor|background|align|valign|cellpadding|cellspacing|border|role)\s*=\s*"[^"]*"/gi, "")
      .replace(/\s(style|class|width|height|bgcolor|background|align|valign|cellpadding|cellspacing|border|role)\s*=\s*'[^']*'/gi, "")
      // 3) Unwrap table/layout tags: turn rows into line breaks, drop the rest,
      //    so the content collapses into a normal top-to-bottom flow.
      .replace(/<\/(tr|table)>/gi, "<br />")
      .replace(/<\/?(table|tbody|thead|tfoot|tr|td|th|center|font|span)[^>]*>/gi, "")
      // 4) Tidy up: kill empty paragraphs and runs of <br>.
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
      // 5) Make links work: open in a new tab, add rel for safety.
      .replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ')
      .trim()
  );
}

// Walk the message parts (recursively) and collect BOTH the plain-text and
// the HTML version of the email body.
// Emails come in many shapes:
//   - simple email -> text sits directly on payload.body.data
//   - multipart    -> payload.parts = [text/plain, text/html, ...] and can nest
function collectBodies(payload?: MessagePart): { plain: string; html: string } {
  let plain = "";
  let html = "";

  const walk = (part?: MessagePart) => {
    if (!part) return;

    if (part.body?.data) {
      const text = decode(part.body.data);
      if (part.mimeType === "text/plain" && !plain) {
        plain = text;
      } else if (part.mimeType === "text/html" && !html) {
        html = text;
      } else if (!part.mimeType && !plain) {
        // Simple emails: body sits on the payload with no mimeType.
        plain = text;
      }
    }

    part.parts?.forEach(walk);
  };

  walk(payload);
  return { plain, html };
}

function headerValue(
  headers: { name?: string; value?: string }[] | undefined,
  name: string
): string | undefined {
  return headers?.find((h) => h.name === name)?.value;
}

function mapToInboxEmail(m: {
  id?: string;
  subject?: string;
  from?: string;
  snippet?: string;
  internalDate?: string | number;
  labelIds?: string[];
}): InboxEmail {
  return {
    id: m.id,
    subject: m.subject,
    from: m.from,
    snippet: m.snippet,
    date: m.internalDate ? Number(m.internalDate) : 0,
    priority: classifyEmail({
      subject: m.subject,
      snippet: m.snippet,
      labels: m.labelIds,
    }),
  };
}

type GmailApiMessage = Awaited<
  ReturnType<ReturnType<typeof corsair.withTenant>["gmail"]["api"]["messages"]["get"]>
>;

/** Persist a Gmail message into Corsair's local DB for fast reads later. */
async function syncMessageToDb(
  tenant: ReturnType<typeof corsair.withTenant>,
  msg: GmailApiMessage
) {
  if (!msg.id) return;

  const headers = msg.payload?.headers;
  const { plain } = collectBodies(msg.payload as MessagePart | undefined);

  await tenant.gmail.db.messages.upsertByEntityId(msg.id, {
    id: msg.id,
    threadId: msg.threadId,
    labelIds: msg.labelIds,
    snippet: msg.snippet,
    internalDate: msg.internalDate,
    historyId: msg.historyId,
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    to: headerValue(headers, "To"),
    body: plain || undefined,
    payload: msg.payload,
  });
}

function messageToInboxEmail(msg: GmailApiMessage): InboxEmail {
  const headers = msg.payload?.headers;
  return mapToInboxEmail({
    id: msg.id,
    subject: headerValue(headers, "Subject"),
    from: headerValue(headers, "From"),
    snippet: msg.snippet,
    internalDate: msg.internalDate,
    labelIds: msg.labelIds,
  });
}

/**
 * Cold path: list inbox from Gmail, fetch full details, sync to local DB,
 * then return for the UI. Next page load reads from DB only.
 */
async function fetchAndSyncFromGmail(
  tenant: ReturnType<typeof corsair.withTenant>,
  limit = INBOX_LIMIT
): Promise<InboxEmail[]> {
  const list = await tenant.gmail.api.messages.list({
    q: "in:inbox",
    maxResults: limit,
  });

  const ids = (list.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  const details = await Promise.all(
    ids.map((id) =>
      tenant.gmail.api.messages.get({
        id,
        format: "full",
      })
    )
  );

  // Write to local DB so the same user doesn't need API calls on the next visit.
  await Promise.all(details.map((msg) => syncMessageToDb(tenant, msg)));

  return details.map(messageToInboxEmail).sort((a, b) => b.date - a.date);
}

/** Fast path: read previously synced messages from Corsair DB. */
async function fetchEmailsFromDb(
  tenant: ReturnType<typeof corsair.withTenant>,
  limit = INBOX_LIMIT
): Promise<InboxEmail[]> {
  const rows = await tenant.gmail.db.messages.search({ limit });
  return rows
    .map(({ data: m }) =>
      mapToInboxEmail({
        id: m.id,
        subject: m.subject,
        from: m.from,
        snippet: m.snippet,
        internalDate: m.internalDate,
        labelIds: m.labelIds,
      })
    )
    .sort((a, b) => b.date - a.date);
}

export default async function getEmails(): Promise<InboxEmail[]> {
  const { userId } = await auth();
  if (!userId) return [];
  return getEmailsForTenant(userId);
}

/** Fetch inbox for any tenant — shared by dashboard and Ask Mcaly agent. */
export async function getEmailsForTenant(
  tenantId: string,
  limit = INBOX_LIMIT
): Promise<InboxEmail[]> {
  const tenant = corsair.withTenant(tenantId);

  try {
    const refreshToken = await tenant.gmail.keys.get_refresh_token();
    if (!refreshToken) return [];
  } catch {
    return [];
  }

  try {
    const cached = await fetchEmailsFromDb(tenant, limit);
    if (cached.length > 0) return cached;
  } catch {
    // fall through
  }

  try {
    return await fetchAndSyncFromGmail(tenant, limit);
  } catch {
    return [];
  }
}

// Just the emails that actually deserve attention, for the dashboard overview.
// We reuse getEmails() (already DB-backed + sorted) and only add the priority
// filter here — so all the "how do we fetch emails" logic stays in one place.
export async function getImportantEmails(limit = 5) {
  const all = await getEmails();
  return all
    .filter((e) => e.priority === "need-action" || e.priority === "important")
    .slice(0, limit);
}

// Fetch ONE email's full detail (including the decoded body). Called when the
// user clicks a row to open the detail drawer.
//
// We try the local DB first (instant, no network). If the synced row doesn't
// carry a usable body, we fall back to a single Gmail API call.
export async function getEmailDetails(id: string): Promise<EmailDetail | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const tenant = corsair.withTenant(userId);

  // 1. Try the local DB row first.
  const rows = await tenant.gmail.db.messages.search({
    data: { id },
    limit: 1,
  });
  const row = rows[0]?.data;

  if (row) {
    // The synced payload may already contain the body parts.
    const { plain, html } = collectBodies(row.payload as MessagePart | undefined);
    const bodyText = plain || row.body || (html ? htmlToText(html) : "");

    // Only return from DB if we actually have something to show.
    if (bodyText || html) {
      return {
        id: row.id,
        threadId: row.threadId,
        subject: row.subject,
        snippet: row.snippet,
        from: row.from,
        to: row.to,
        date: row.internalDate ? Number(row.internalDate) : 0,
        priority: classifyEmail({
          subject: row.subject,
          snippet: row.snippet,
          labels: row.labelIds,
        }),
        body: bodyText.replace(/\n{3,}/g, "\n\n").trim(),
        html: html ? sanitizeHtml(html) : "",
      };
    }
  }

  // 2. Fallback: fetch the full message from Gmail, sync to DB, return.
  const email = await tenant.gmail.api.messages.get({ id, format: "full" });
  await syncMessageToDb(tenant, email);

  const headers = email.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((h) => h.name === name)?.value;

  const subject = header("Subject");
  const snippet = email.snippet;
  const from = header("From");
  const to = header("To");

  // Pull both versions of the body out of the message.
  const { plain, html } = collectBodies(email.payload);

  return {
    id: email.id,
    threadId: email.threadId,
    subject,
    snippet,
    from,
    to,
    date: email.internalDate ? Number(email.internalDate) : 0,
    priority: classifyEmail({ subject, snippet, labels: email.labelIds }),
    // Plain text: prefer the real plain part, else flatten the HTML.
    body: plain ? plain.replace(/\n{3,}/g, "\n\n").trim() : htmlToText(html),
    // Sanitized HTML for nice rendering with working links (empty if none).
    html: html ? sanitizeHtml(html) : "",
  };
}
