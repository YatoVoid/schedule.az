import { requireStoreMember } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function StaffLayout({
  children,
  params,
}: LayoutProps<"/staff/[slug]">) {
  const { slug } = await params;
  const { membership } = await requireStoreMember(slug);

  const links = [{ href: `/staff/${slug}`, label: "My calendar" }];

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <DashboardNav
        storeName={membership.store.name}
        roleLabel={membership.role === "ADMIN" ? "Admin" : "Staff"}
        logoUrl={storeLogoUrl(membership.store.id, membership.store.logoUpdatedAt)}
        links={links}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
