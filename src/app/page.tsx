import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { storeImageUrl } from "@/lib/store-images";
import { distanceKm } from "@/lib/geo";
import { SiteHeader } from "@/components/site-header";
import { StoreSearchForm } from "@/components/store-search-form";
import { DirectoryHero, OwnerBand } from "@/components/directory-hero";
import { DirectoryView, type DirectoryStore } from "@/components/directory-view";
import type { DirectorySort } from "@/components/directory-filters";

const SERVICES_PER_CARD = 3;

export default async function Home({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const autoFocusSearch = params.focus === "search";
  const category = typeof params.category === "string" ? params.category.trim() : "";
  const rawLat = typeof params.lat === "string" ? Number(params.lat) : NaN;
  const rawLng = typeof params.lng === "string" ? Number(params.lng) : NaN;
  const userLat = Number.isFinite(rawLat) ? rawLat : null;
  const userLng = Number.isFinite(rawLng) ? rawLng : null;
  const sort: DirectorySort =
    params.sort === "distance" && userLat !== null && userLng !== null
      ? "distance"
      : params.sort === "rating"
        ? "rating"
        : "newest";

  const [currentUser, categoryRows, allStoreNames, stores] = await Promise.all([
    getCurrentUser(),
    prisma.store.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    // Case-insensitive collision check across every store, not just this
    // filtered result set — two same-named businesses can be confusable
    // even when a search happens to only surface one of them at a time.
    prisma.store.findMany({ select: { name: true } }),
    prisma.store.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { members: { some: { user: { name: { contains: q, mode: "insensitive" } } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" } },
        services: { where: { active: true }, orderBy: { createdAt: "asc" }, take: SERVICES_PER_CARD },
      },
    }),
  ]);

  const categories = categoryRows.map((c) => c.category);
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];

  const nameCounts = new Map<string, number>();
  for (const s of allStoreNames) {
    const key = s.name.trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const [favoritedStoreIds, ratingRows] = await Promise.all([
    currentUser
      ? prisma.favorite
          .findMany({
            where: { userId: currentUser.id, storeId: { in: stores.map((s) => s.id) } },
            select: { storeId: true },
          })
          .then((rows) => new Set(rows.map((f) => f.storeId)))
      : Promise.resolve(new Set<string>()),
    prisma.review.groupBy({
      by: ["storeId"],
      where: { storeId: { in: stores.map((s) => s.id) } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const ratingByStore = new Map(ratingRows.map((r) => [r.storeId, { average: r._avg.rating!, count: r._count.rating }]));

  // Stores without saved coordinates can't be placed on the distance scale,
  // so they sort after every store that has one rather than at an arbitrary
  // position among them. Same idea for rating: stores with no reviews yet
  // sort after every store that has at least one, never mixed in at random.
  const storesWithDistance = stores.map((store) => ({
    store,
    distance:
      sort === "distance" && store.latitude !== null && store.longitude !== null
        ? distanceKm(userLat as number, userLng as number, store.latitude, store.longitude)
        : null,
    rating: ratingByStore.get(store.id) ?? null,
  }));
  if (sort === "distance") {
    storesWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  } else if (sort === "rating") {
    storesWithDistance.sort((a, b) => {
      if (a.rating === null && b.rating === null) return 0;
      if (a.rating === null) return 1;
      if (b.rating === null) return -1;
      return b.rating.average - a.rating.average;
    });
  }

  const directoryStores: DirectoryStore[] = storesWithDistance.map(({ store, distance, rating }) => ({
    id: store.id,
    slug: store.slug,
    name: store.name,
    category: store.category,
    address: store.address,
    phone: store.phone,
    description: store.description,
    logoUrl: storeLogoUrl(store.id, store.logoUpdatedAt),
    images: store.images.map((img) => storeImageUrl(store.id, img)),
    distanceKm: distance,
    rating,
    hasDuplicateName: (nameCounts.get(store.name.trim().toLowerCase()) ?? 0) > 1,
    services: store.services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceAzn: s.priceAzn ? s.priceAzn.toString() : null,
    })),
    isFavorited: favoritedStoreIds.has(store.id),
    latitude: store.latitude,
    longitude: store.longitude,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader loggedIn={!!currentUser} userName={currentUser?.name} memberships={memberships} />

      <main className="flex flex-1 flex-col">
        <DirectoryHero />

        <section id="discover" className="scroll-mt-20 bg-sage-soft py-14 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
            <div className="flex flex-col gap-3">
              <p className="eyebrow text-coral">
                {directoryStores.length} {directoryStores.length === 1 ? "place" : "places"} in Baku
              </p>
              <h2 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
                Pick a place,
                <br />
                <em className="text-primary">then a time.</em>
              </h2>
            </div>

            <StoreSearchForm
              initialQuery={q}
              initialCategory={category}
              initialSort={sort}
              initialLat={userLat !== null ? String(userLat) : ""}
              initialLng={userLng !== null ? String(userLng) : ""}
              categories={categories}
              autoFocusSearch={autoFocusSearch}
            />

            <DirectoryView
              stores={directoryStores}
              isLoggedIn={!!currentUser}
              emptyMessage={q || category ? "No businesses match that search." : "No businesses on Schedule.az yet."}
            />
          </div>
        </section>

        <OwnerBand />
      </main>
    </div>
  );
}
