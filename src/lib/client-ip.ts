import { headers } from "next/headers";

// nginx sets X-Real-IP from $remote_addr, which its real_ip config resolves
// to the visitor's address behind Cloudflare (set_real_ip_from on
// Cloudflare's ranges, real_ip_header CF-Connecting-IP). Anything outside a
// request (scripts, the reminder loop) has no client IP.
export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-real-ip")?.trim() || null;
  } catch {
    return null;
  }
}
