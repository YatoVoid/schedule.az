const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "www.google.com",
  "google.com",
  "maps.google.com",
]);

export type ResolvedMapsLink =
  | { ok: true; address: string | null; latitude: number; longitude: number }
  | { ok: false; error: string };

// Resolves a pasted Google Maps share link (including short links like
// maps.app.goo.gl/...) into a lat/lng and a best-effort place name, without
// needing a Google API key: short links redirect to a long-form URL that
// almost always embeds the coordinates directly (e.g. ".../@40.40,49.86,17z"
// or "?q=40.40,49.86"), which a plain server-side fetch-and-follow-redirects
// can read. Hostname is allowlisted before fetching, this action accepts an
// arbitrary user-supplied URL and fetches it server-side, so without the
// allowlist it would be an open SSRF proxy.
export async function resolveGoogleMapsLink(rawUrl: string): Promise<ResolvedMapsLink> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "That doesn't look like a valid link" };
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return { ok: false, error: "Paste a Google Maps link (maps.app.goo.gl or google.com/maps)" };
  }

  let finalUrl: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), { redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    finalUrl = res.url;
  } catch {
    return { ok: false, error: "Couldn't reach that link, try again" };
  }

  const coordMatch =
    /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(finalUrl) ?? /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(finalUrl);
  if (!coordMatch) {
    return { ok: false, error: "Couldn't find a location in that link, enter the address manually" };
  }
  const latitude = Number(coordMatch[1]);
  const longitude = Number(coordMatch[2]);

  const nameMatch = /\/maps\/place\/([^/@]+)/.exec(finalUrl);
  const address = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, " ")) : null;

  return { ok: true, address, latitude, longitude };
}
