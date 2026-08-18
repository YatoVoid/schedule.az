import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { ServiceManager } from "./service-manager";

export default async function ServicesPage({
  params,
}: PageProps<"/admin/[slug]/services">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);

  const services = await prisma.service.findMany({
    where: { storeId: membership.storeId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ServiceManager
      slug={slug}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceAzn: s.priceAzn ? s.priceAzn.toString() : null,
        active: s.active,
      }))}
    />
  );
}
