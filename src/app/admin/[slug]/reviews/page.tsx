import { StarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminReviewsPage({
  params,
}: PageProps<"/admin/[slug]/reviews">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);
  const storeId = membership.storeId;

  const [ratingAgg, reviews] = await Promise.all([
    prisma.review.aggregate({ where: { storeId }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.review.findMany({
      where: { storeId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const countByStars = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl font-medium tracking-tight">Ratings</CardTitle>
          {ratingAgg._count.rating > 0 && (
            <div className="flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5">
              <StarIcon className="size-4 text-primary" fill="currentColor" />
              <span className="font-mono text-xl font-medium tabular-nums">{ratingAgg._avg.rating!.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                across {ratingAgg._count.rating} rating{ratingAgg._count.rating === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {ratingAgg._count.rating === 0 ? (
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          ) : (
            <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
              {countByStars.map(({ stars, count }) => (
                <div key={stars} className="flex flex-col-reverse gap-1 rounded-xl border px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground">
                    {stars} star{stars === 1 ? "" : "s"}
                  </dt>
                  <dd className="font-mono text-lg tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl font-medium tracking-tight">Reviews</CardTitle>
          {reviews.length > 0 && (
            <span className="rounded-full border bg-secondary px-3 py-1 text-sm text-muted-foreground">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-0.5 text-primary" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} className="size-4" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{r.createdAt.toLocaleDateString()}</span>
                  </div>
                  {r.message && <p className="text-base">{r.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    {r.user.name ?? "No name on file"}
                    {r.user.phone ? ` · ${r.user.phone}` : ""}
                    {r.user.email ? ` · ${r.user.email}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
