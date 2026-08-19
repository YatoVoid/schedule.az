import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { storeImageUrl } from "@/lib/store-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryUploader } from "@/components/gallery-uploader";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[slug]/settings">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);
  const store = membership.store;
  const images = await prisma.storeImage.findMany({
    where: { storeId: store.id },
    orderBy: { position: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            slug={slug}
            initial={{
              name: store.name,
              category: store.category,
              address: store.address ?? "",
              description: store.description ?? "",
              logoUrl: storeLogoUrl(store.id, store.logoUpdatedAt),
              latitude: store.latitude,
              longitude: store.longitude,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <GalleryUploader
            slug={slug}
            initialImages={images.map((img) => ({ id: img.id, url: storeImageUrl(store.id, img) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
