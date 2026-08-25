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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {ratingAgg._count.rating === 0 ? (
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          ) : (
            <div className="flex items-center gap-2">
              <StarIcon className="size-5 text-primary" fill="currentColor" />
              <span className="text-2xl font-medium font-mono tabular-nums">{ratingAgg._avg.rating!.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                average across {ratingAgg._count.rating} rating{ratingAgg._count.rating === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-0.5 text-primary">
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} className="size-3.5" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.createdAt.toLocaleDateString()}</span>
                  </div>
                  {r.message && <p className="text-sm">{r.message}</p>}
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
