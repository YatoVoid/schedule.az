import { requireStoreMember, getUserMemberships } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { SiteHeader } from "@/components/site-header";
import { StudioIntro } from "@/components/studio-intro";

export default async function StaffLayout({
  children,
  params,
}: LayoutProps<"/staff/[slug]">) {
  const { slug } = await params;
  const { user, membership } = await requireStoreMember(slug);
  const memberships = await getUserMemberships(user.id);

  const links = [{ href: `/staff/${slug}`, label: "My calendar" }];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        loggedIn
        userName={user.name}
        memberships={memberships}
        links={links}
        scrollLinksOnMobile
        currentSlug={slug}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
        <StudioIntro
          storeName={membership.store.name}
          roleLabel={membership.role === "ADMIN" ? "Owner" : "Staff"}
          logoUrl={storeLogoUrl(membership.store.id, membership.store.logoUpdatedAt)}
        />
        {children}
      </main>
    </div>
  );
}
