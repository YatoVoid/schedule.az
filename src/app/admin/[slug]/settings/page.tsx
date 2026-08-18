import { requireStoreAdmin } from "@/lib/auth";
import { storeLogoUrl } from "@/lib/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: PageProps<"/admin/[slug]/settings">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);
  const store = membership.store;

  return (
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
  );
}
