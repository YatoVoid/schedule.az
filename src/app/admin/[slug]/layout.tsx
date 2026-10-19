import { requireStoreAdmin, getUserMemberships } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { SiteHeader } from "@/components/site-header";
import { StudioIntro } from "@/components/studio-intro";

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/admin/[slug]">) {
  const { slug } = await params;
  const { user, membership } = await requireStoreAdmin(slug);
  const memberships = await getUserMemberships(user.id);

  const links = [
    { href: `/admin/${slug}`, label: "Overview" },
    { href: `/admin/${slug}/bookings`, label: "Bookings" },
    { href: `/admin/${slug}/services`, label: "Services" },
    { href: `/admin/${slug}/staff`, label: "Staff" },
    { href: `/admin/${slug}/reviews`, label: "Reviews" },
    { href: `/admin/${slug}/settings`, label: "Branding" },
  ];

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
          roleLabel={"Owner"}
          logoUrl={storeLogoUrl(membership.store.id, membership.store.logoUpdatedAt)}
        />
        {children}
      </main>
    </div>
  );
}
