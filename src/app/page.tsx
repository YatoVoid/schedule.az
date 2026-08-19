import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { storeImageUrl } from "@/lib/store-images";
import { SiteHeader } from "@/components/site-header";
import { StoreSearchForm } from "@/components/store-search-form";
import { StorePanel } from "@/components/store-panel";

export default async function Home({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category.trim() : "";

  const [currentUser, categoryRows, stores] = await Promise.all([
    getCurrentUser(),
    prisma.store.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
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
      include: { images: { orderBy: { position: "asc" } } },
    }),
  ]);

  const categories = categoryRows.map((c) => c.category);
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader loggedIn={!!currentUser} memberships={memberships} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-medium tracking-tight">Find a business to book</h1>
          <p className="text-sm text-muted-foreground">
            Search by business or by the professional you usually see.
          </p>
        </div>

        <StoreSearchForm initialQuery={q} initialCategory={category} categories={categories} />

        {stores.length === 0 ? (
          <p className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            {q || category ? "No businesses match that search." : "No businesses on Schedule.az yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stores.map((store) => (
              <StorePanel
                key={store.id}
                store={{
                  id: store.id,
                  slug: store.slug,
                  name: store.name,
                  category: store.category,
                  address: store.address,
                  logoUrl: storeLogoUrl(store.id, store.logoUpdatedAt),
                  images: store.images.map((img) => storeImageUrl(store.id, img)),
                }}
              />
            ))}
          </div>
        )}

        {!memberships.some((m) => m.role === "ADMIN") && (
          <div className="mt-4 border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground">Run a business in Baku?</p>
            <Link
              href={currentUser ? "/onboarding" : "/login"}
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              List it on Schedule.az
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
