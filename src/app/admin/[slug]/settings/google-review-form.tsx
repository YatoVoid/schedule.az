"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGoogleReviewUrlAction } from "./actions";

export function GoogleReviewForm({ slug, initialUrl }: { slug: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateGoogleReviewUrlAction(slug, url);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved");
    });
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isPending) handleSubmit();
      }}
    >
      <Label htmlFor="google-review-url">Google review link</Label>
      <Input
        id="google-review-url"
        placeholder="https://g.page/r/.../review"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-12 text-base"
      />
      <p className="text-xs text-muted-foreground">
        After rating you here, customers can also post the same rating on Google, no matter the score. Find this
        link in your Google Business Profile under &quot;Ask for reviews.&quot;
      </p>
      <Button type="submit" variant="outline" className="w-fit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
