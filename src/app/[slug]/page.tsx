import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { storeLogoUrl } from "@/lib/logo";
import { storeImageUrl } from "@/lib/store-images";
import { categoryGuardVar } from "@/lib/category-color";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { ServiceList } from "@/components/service-list";
import { StoreGallery } from "@/components/store-gallery";
import { ReviewForm } from "@/components/review-form";
import { BookingFlow } from "./booking-flow";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  if (!store) return {};

  const title = `${store.name}, book online in Baku`;
  const description =
    store.description?.trim() ||
    `Book an appointment at ${store.name}${store.address ? `, ${store.address}` : ", Baku"}. ${store.category}, confirmed by the business.`;
  const image = store.images[0] ? storeImageUrl(store.id, store.images[0]) : storeLogoUrl(store.id, store.logoUpdatedAt);
  const ogImage = image ?? "/opengraph-image";

  return {
    title,
    description,
    alternates: { canonical: `/${store.slug}` },
    openGraph: {
      title,
      description,
      url: `/${store.slug}`,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
      images: { orderBy: { position: "asc" } },
    },
  });
  if (!store) notFound();

  const currentUser = await getCurrentUser();
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];
  const [favorite, ratingAgg, existingReview, completedBooking] = await Promise.all([
    currentUser
      ? prisma.favorite.findUnique({ where: { userId_storeId: { userId: currentUser.id, storeId: store.id } } })
      : null,
    prisma.review.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { rating: true } }),
    currentUser
      ? prisma.review.findUnique({ where: { userId_storeId: { userId: currentUser.id, storeId: store.id } } })
      : null,
    currentUser
      ? prisma.booking.findFirst({
          where: { userId: currentUser.id, storeId: store.id, status: "COMPLETED" },
          select: { id: true },
        })
      : null,
  ]);
  const ratingSummary = ratingAgg._count.rating > 0 ? { average: ratingAgg._avg.rating!, count: ratingAgg._count.rating } : null;

  const logoUrl = storeLogoUrl(store.id, store.logoUpdatedAt);
  const guard = categoryGuardVar(store.category);
  const galleryImages = store.images.map((img) => storeImageUrl(store.id, img));

  const bookingFlow = (
    <BookingFlow
      storeSlug={slug}
      storeName={store.name}
      storeAddress={store.address}
      professionals={store.members.map((m) => ({ id: m.id, name: m.user.name ?? m.user.phone ?? "Team member" }))}
      services={store.services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        priceAzn: s.priceAzn ? s.priceAzn.toString() : null,
      }))}
      initialUser={currentUser}
    />
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.az";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/${store.slug}`,
    name: store.name,
    url: `${siteUrl}/${store.slug}`,
    ...(store.description ? { description: store.description } : {}),
    ...(store.address ? { address: { "@type": "PostalAddress", streetAddress: store.address, addressLocality: "Baku", addressCountry: "AZ" } } : {}),
    ...(store.latitude !== null && store.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude } }
      : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    ...(logoUrl || galleryImages[0] ? { image: `${siteUrl}${logoUrl ?? galleryImages[0]}` } : {}),
    ...(ratingSummary
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average,
            reviewCount: ratingSummary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(store.services.length
      ? {
          makesOffer: store.services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name },
            ...(s.priceAzn ? { price: s.priceAzn.toString(), priceCurrency: "AZN" } : {}),
          })),
        }
      : {}),
  };

  return (
    <>
    <SiteHeader loggedIn={!!currentUser} userName={currentUser?.name} memberships={memberships} />
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex flex-col gap-6">
          {galleryImages.length > 0 && <StoreGallery images={galleryImages} guard={guard} />}

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              {logoUrl && <AvatarImage src={logoUrl} alt="" />}
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">{store.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="truncate font-heading text-3xl font-medium tracking-tight">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{store.category}</Badge>
                {ratingSummary && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <StarIcon className="size-3.5 text-primary" fill="currentColor" />
                    <span className="font-medium text-foreground">{ratingSummary.average.toFixed(1)}</span>
                    <span>({ratingSummary.count})</span>
                  </span>
                )}
                {store.address && <span className="text-sm text-muted-foreground">{store.address}</span>}
                {store.phone && <span className="text-sm text-muted-foreground">{store.phone}</span>}
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
              <h2 className="text-sm font-medium text-muted-foreground">
                Services · {store.services.length} · from{" "}
                {(() => {
                  const priced = store.services.map((s) => s.priceAzn).filter((p): p is NonNullable<typeof p> => p !== null);
                  return priced.length > 0 ? `${Math.min(...priced.map((p) => p.toNumber()))} AZN` : "ask in store";
                })()}
              </h2>
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

          {completedBooking && (
            <ReviewForm
              storeSlug={slug}
              initialReview={existingReview ? { rating: existingReview.rating, message: existingReview.message } : null}
              googleReviewUrl={store.googleReviewUrl}
            />
          )}
        </div>

        {/* Single BookingFlow instance, repositioned by CSS grid placement
            rather than duplicated: on mobile (grid-cols-1) it just falls in
            as the next block after the left column; at lg+ it moves into
            the second column and sticks, the sira-style "choose services,
            book right here" rail instead of a step scrolled far below. */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1">
          <h2 className="eyebrow text-muted-foreground">Book an appointment</h2>
          {bookingFlow}
        </div>
      </div>
    </main>
    </>
  );
}
