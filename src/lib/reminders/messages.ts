import { formatMinutes } from "@/lib/schedule";
import { buildMapsUrl } from "@/lib/maps-url";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.az").replace(/\/+$/, "");
const MAX_ABOUT_CHARS = 200;

// The DESIGN.md palette is authored in oklch, which many email clients still
// don't parse in inline styles, so these are the same tokens converted to
// sRGB hex for the email body only (--foreground, --muted-foreground,
// --primary, --card). Webfonts don't load reliably in mail either, hence a
// plain system stack instead of Golos Text.
const EMAIL = {
  ink: "#201914",
  muted: "#665b53",
  primary: "#a12623",
  ground: "#fffbf7",
  font: "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif",
};

export type ReminderContext = {
  kind: "APPOINTMENT" | "WINBACK" | "CONFIRMATION";
  channel: "SMS" | "EMAIL";
  userName: string | null;
  store: {
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  staffName: string | null;
  startAt: Date | null;
  unsubscribeUrl: string | null;
};

export type RenderedReminder = { subject: string; text: string; html?: string };

// Store text is owner-controlled, so it is escaped for the HTML body and
// stripped of control characters / collapsed for the single-line SMS.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function smsClean(s: string): string {
  // Flatten the text body to a single SMS line and strip any control
  // characters an owner could have pasted into a store field, so segment
  // counts stay predictable.
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function about(store: ReminderContext["store"]): string | null {
  const d = store.description?.trim();
  if (!d) return null;
  return d.length > MAX_ABOUT_CHARS ? `${d.slice(0, MAX_ABOUT_CHARS).trimEnd()}…` : d;
}

function bakuDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function bakuTime(d: Date): string {
  return formatMinutes(d.getUTCHours() * 60 + d.getUTCMinutes());
}

function storeUrl(slug: string): string {
  return `${SITE_URL}/${slug}`;
}

function htmlShell(bodyRows: string[]): string {
  return [
    `<div style="font-family:${EMAIL.font};background:${EMAIL.ground};color:${EMAIL.ink};font-size:15px;line-height:1.5;max-width:520px">`,
    ...bodyRows,
    `<p style="color:${EMAIL.muted};font-size:12px;margin-top:24px">Schedule.az</p>`,
    `</div>`,
  ].join("");
}

function renderAppointment(ctx: ReminderContext): RenderedReminder {
  const { store, staffName, startAt, userName } = ctx;
  if (!startAt) throw new Error("appointment reminder needs startAt");

  const date = bakuDate(startAt);
  const time = bakuTime(startAt);
  const maps = buildMapsUrl(store);
  const hi = userName ? `${userName}, ` : "";

  const smsBits = [
    `Schedule.az: ${hi}a quick reminder about your visit to ${store.name} today at ${time}` +
      (staffName ? ` with ${staffName}` : "") +
      ".",
    maps ? maps : null,
  ].filter(Boolean) as string[];

  const text = [
    `${hi}a quick reminder about your visit to ${store.name}.`,
    ``,
    `When: ${date}, ${time}`,
    staffName ? `With: ${staffName}` : null,
    store.address ? `Where: ${store.address}` : null,
    maps ? `Map: ${maps}` : null,
    about(store) ? `` : null,
    about(store) ? `About ${store.name}: ${about(store)}` : null,
    ``,
    `See you soon.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = htmlShell(
    [
      `<p style="margin:0 0 12px">${hi ? esc(userName!) + ", a" : "A"} quick reminder about your visit to <strong>${esc(store.name)}</strong>.</p>`,
      `<table style="border-collapse:collapse;margin:0 0 12px"><tbody>`,
      `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">When</td><td style="padding:2px 0"><strong>${esc(date)}, ${esc(time)}</strong></td></tr>`,
      staffName ? `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">With</td><td style="padding:2px 0">${esc(staffName)}</td></tr>` : "",
      store.address ? `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">Where</td><td style="padding:2px 0">${esc(store.address)}</td></tr>` : "",
      `</tbody></table>`,
      maps
        ? `<p style="margin:0 0 12px"><a href="${esc(maps)}" style="color:${EMAIL.primary}">Open in Google Maps</a></p>`
        : "",
      about(store) ? `<p style="margin:0 0 12px;color:${EMAIL.muted}">${esc(about(store)!)}</p>` : "",
      `<p style="margin:0">See you soon.</p>`,
    ].filter(Boolean),
  );

  return {
    subject: `Your visit to ${store.name} is today`,
    text: ctx.channel === "SMS" ? smsBits.join("\n") : text,
    html,
  };
}

function renderConfirmation(ctx: ReminderContext): RenderedReminder {
  const { store, staffName, startAt, userName } = ctx;
  if (!startAt) throw new Error("confirmation needs startAt");

  const date = bakuDate(startAt);
  const time = bakuTime(startAt);
  const maps = buildMapsUrl(store);
  const hi = userName ? `${userName}, ` : "";

  const sms = [
    `Schedule.az: ${hi}your booking at ${store.name} on ${date} at ${time}` +
      (staffName ? ` with ${staffName}` : "") +
      " is confirmed.",
    maps ? maps : null,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `${hi}your booking at ${store.name} is confirmed.`,
    ``,
    `When: ${date}, ${time}`,
    staffName ? `With: ${staffName}` : null,
    store.address ? `Where: ${store.address}` : null,
    maps ? `Map: ${maps}` : null,
    ``,
    `We'll send a reminder on the day.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = htmlShell(
    [
      `<p style="margin:0 0 12px">${hi ? esc(userName!) + ", your" : "Your"} booking at <strong>${esc(store.name)}</strong> is confirmed.</p>`,
      `<table style="border-collapse:collapse;margin:0 0 12px"><tbody>`,
      `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">When</td><td style="padding:2px 0"><strong>${esc(date)}, ${esc(time)}</strong></td></tr>`,
      staffName ? `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">With</td><td style="padding:2px 0">${esc(staffName)}</td></tr>` : "",
      store.address ? `<tr><td style="padding:2px 12px 2px 0;color:${EMAIL.muted}">Where</td><td style="padding:2px 0">${esc(store.address)}</td></tr>` : "",
      `</tbody></table>`,
      maps
        ? `<p style="margin:0 0 12px"><a href="${esc(maps)}" style="color:${EMAIL.primary}">Open in Google Maps</a></p>`
        : "",
      `<p style="margin:0;color:${EMAIL.muted}">We'll send a reminder on the day.</p>`,
    ].filter(Boolean),
  );

  return {
    subject: `Your booking at ${store.name} is confirmed`,
    text: ctx.channel === "SMS" ? sms : text,
    html,
  };
}

function renderWinback(ctx: ReminderContext): RenderedReminder {
  const { store, userName, unsubscribeUrl } = ctx;
  const url = storeUrl(store.slug);
  const hi = userName ? `${userName}, ` : "";

  const sms = [
    `Schedule.az: ${hi}it's been a while since your visit to ${store.name}. Book again: ${url}`,
    unsubscribeUrl ? `Stop these: ${unsubscribeUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `${hi}it's been a while since your last visit to ${store.name}.`,
    about(store) ? `` : null,
    about(store) ? about(store) : null,
    ``,
    `Book your next visit: ${url}`,
    ``,
    unsubscribeUrl ? `You're getting this because you visited ${store.name}. Stop these reminders: ${unsubscribeUrl}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = htmlShell(
    [
      `<p style="margin:0 0 12px">${hi ? esc(userName!) + ", it" : "It"}'s been a while since your last visit to <strong>${esc(store.name)}</strong>.</p>`,
      about(store) ? `<p style="margin:0 0 12px;color:${EMAIL.muted}">${esc(about(store)!)}</p>` : "",
      `<p style="margin:0 0 16px"><a href="${esc(url)}" style="color:${EMAIL.primary}">Book your next visit</a></p>`,
      unsubscribeUrl
        ? `<p style="color:${EMAIL.muted};font-size:12px;margin:0">You're getting this because you visited ${esc(store.name)}. <a href="${esc(unsubscribeUrl)}" style="color:${EMAIL.muted}">Stop these reminders</a>.</p>`
        : "",
    ].filter(Boolean),
  );

  return {
    subject: `Time for your next visit to ${store.name}?`,
    text: ctx.channel === "SMS" ? sms : text,
    html,
  };
}

export function renderReminder(ctx: ReminderContext): RenderedReminder {
  const rendered =
    ctx.kind === "APPOINTMENT"
      ? renderAppointment(ctx)
      : ctx.kind === "CONFIRMATION"
        ? renderConfirmation(ctx)
        : renderWinback(ctx);
  if (ctx.channel === "SMS") return { subject: rendered.subject, text: smsClean(rendered.text) };
  return rendered;
}
