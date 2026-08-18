import { requireStoreAdmin } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/admin/[slug]">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);

  const links = [
    { href: `/admin/${slug}`, label: "Overview" },
    { href: `/admin/${slug}/bookings`, label: "Bookings" },
    { href: `/admin/${slug}/services`, label: "Services" },
    { href: `/admin/${slug}/staff`, label: "Staff" },
    { href: `/admin/${slug}/settings`, label: "Branding" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <DashboardNav
        storeName={membership.store.name}
        roleLabel="Admin"
        logoUrl={storeLogoUrl(membership.store.id, membership.store.logoUpdatedAt)}
        links={links}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
