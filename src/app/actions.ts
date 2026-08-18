"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { requireUser } from "@/lib/auth";
import { resolveGoogleMapsLink, type ResolvedMapsLink } from "@/lib/maps-link";

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  // Not /login: that's the business-owner entry point and force-onboards
  // any phone number with no store membership. Logging out should land
  // somewhere neutral, the homepage's own "Log in" link is the
  // consumer-safe entry (/login?next=/account).
  redirect("/");
}

export async function resolveMapsLinkAction(url: string): Promise<ResolvedMapsLink> {
  await requireUser();
  return resolveGoogleMapsLink(url);
}
