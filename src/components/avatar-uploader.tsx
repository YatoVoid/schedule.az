"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadAvatarAction } from "@/app/profile-setup/actions";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function AvatarUploader({
  initialAvatarUrl,
  fallbackInitial,
  size = "lg",
}: {
  initialAvatarUrl: string | null;
  fallbackInitial: string;
  size?: "lg" | "md";
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [isPending, startTransition] = useTransition();

  const dimension = size === "lg" ? "h-24 w-24" : "h-16 w-16";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        setPreview(initialAvatarUrl);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative ${dimension} shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted`}
      >
        {preview ? (
          // Uploaded profile photo, not a design asset, so a plain <img>
          // avoids next/image's remote-pattern config for a same-origin route.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-heading text-xl text-muted-foreground">
            {fallbackInitial}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? "..." : preview ? "Change" : "Add photo"}
        </span>
      </button>
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-4"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
      >
        {preview ? "Change photo" : "Add a profile photo"}
      </button>
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
