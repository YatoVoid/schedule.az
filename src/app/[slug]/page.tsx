import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { ServiceList } from "@/components/service-list";
import { BookingFlow } from "./booking-flow";

export default async function StorePage({
  params,
}: PageProps<"/[slug]">) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { createdAt: "asc" } },
      // Only members who've actually set working hours are bookable — being
      // an admin/owner doesn't make someone a bookable professional, having
      // hours configured does. Otherwise an owner who just manages the shop
      // shows up as bookable by default, which isn't what most owners want.
      members: { where: { availability: { some: {} } }, include: { user: true }, orderBy: { role: "asc" } },
    },
  });
  if (!store) notFound();

  const currentUser = await getCurrentUser();
  const favorite = currentUser
    ? await prisma.favorite.findUnique({ where: { userId_storeId: { userId: currentUser.id, storeId: store.id } } })
    : null;

  const logoUrl = storeLogoUrl(store.id, store.logoUpdatedAt);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← All businesses
      </Link>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          {logoUrl && <AvatarImage src={logoUrl} alt="" />}
          <AvatarFallback className="text-lg">{store.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{store.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{store.category}</Badge>
            {store.address && <span className="text-sm text-muted-foreground">{store.address}</span>}
          </div>
        </div>
        <FavoriteButton storeId={store.id} initialFavorited={!!favorite} isLoggedIn={!!currentUser} />
      </div>

      {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}

      {store.latitude !== null && store.longitude !== null && (
        <div className="overflow-hidden rounded-xl border">
          <iframe
            title="Location"
            src={`https://www.google.com/maps?q=${store.latitude},${store.longitude}&z=16&output=embed`}
            className="h-48 w-full"
            loading="lazy"
          />
        </div>
      )}

      {store.services.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Services</h2>
          <ServiceList
            services={store.services.map((s) => ({
              id: s.id,
              name: s.name,
              durationMin: s.durationMin,
              priceAzn: s.priceAzn ? s.priceAzn.toString() : null,
            }))}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Book an appointment</h2>
        <BookingFlow
          storeSlug={slug}
          professionals={store.members.map((m) => ({ id: m.id, name: m.user.name ?? m.user.phone ?? "Team member" }))}
          services={store.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMin: s.durationMin,
            priceAzn: s.priceAzn ? s.priceAzn.toString() : null,
          }))}
          initialUser={currentUser}
        />
      </div>
    </main>
  );
}
