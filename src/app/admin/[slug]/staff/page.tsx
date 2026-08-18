import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { StaffManager } from "./staff-manager";

export default async function StaffPage({
  params,
}: PageProps<"/admin/[slug]/staff">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);

  const members = await prisma.storeMember.findMany({
    where: { storeId: membership.storeId },
    include: { user: true },
    orderBy: { role: "asc" },
  });

  return (
    <StaffManager
      slug={slug}
      currentMemberId={membership.id}
      members={members.map((m) => ({
        id: m.id,
        phone: m.user.phone,
        name: m.user.name,
        role: m.role,
      }))}
    />
  );
}
