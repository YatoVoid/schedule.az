import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { StoreSearchForm } from "@/components/store-search-form";

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
    }),
  ]);

  const categories = categoryRows.map((c) => c.category);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader loggedIn={!!currentUser} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Find a business to book</h1>
          <p className="text-sm text-muted-foreground">
            Search by business or by the professional you usually see.
          </p>
        </div>

        <StoreSearchForm initialQuery={q} initialCategory={category} categories={categories} />

        <div className="flex flex-col gap-3">
          {stores.length === 0 ? (
            <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              {q || category ? "No businesses match that search." : "No businesses on Schedule.az yet."}
            </p>
          ) : (
            stores.map((store) => <StoreCard key={store.id} store={store} />)
          )}
        </div>

        <div className="mt-4 border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">Run a business in Baku?</p>
          <Link href="/login" className="text-sm font-medium text-primary underline underline-offset-4">
            List it on Schedule.az
          </Link>
        </div>
      </main>
    </div>
  );
}

function StoreCard({
  store,
}: {
  store: {
    id: string;
    slug: string;
    name: string;
    category: string;
    address: string | null;
    logoUpdatedAt: Date | null;
  };
}) {
  const logoUrl = storeLogoUrl(store.id, store.logoUpdatedAt);
  return (
    <Link
      href={`/${store.slug}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
    >
      <Avatar className="h-12 w-12 shrink-0">
        {logoUrl && <AvatarImage src={logoUrl} alt="" />}
        <AvatarFallback>{store.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{store.name}</p>
        <p className="truncate text-sm text-muted-foreground">{store.address ?? "Baku"}</p>
      </div>
      <Badge variant="outline" className="shrink-0">
        {store.category}
      </Badge>
    </Link>
  );
}
