"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadStoreLogoAction } from "@/app/admin/[slug]/settings/actions";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export function LogoUploader({
  slug,
  storeName,
  initialLogoUrl,
}: {
  slug: string;
  storeName: string;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialLogoUrl);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadStoreLogoAction(slug, formData);
      if (!result.ok) {
        toast.error(result.error);
        setPreview(initialLogoUrl);
        return;
      }
      toast.success("Logo updated");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
      >
        {preview ? (
          // Uploaded store logos, not a design asset, so a plain <img> avoids
          // next/image's remote-pattern config for a same-origin API route.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-medium text-muted-foreground">{storeName.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          Change
        </span>
      </button>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {isPending ? "Uploading..." : "Change logo"}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 5MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
