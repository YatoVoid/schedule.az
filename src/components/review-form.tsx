"use client";

import { useState, useTransition } from "react";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "@/app/[slug]/actions";

type ExistingReview = { rating: number; message: string | null };

export function ReviewForm({
  storeSlug,
  initialReview,
  googleReviewUrl,
}: {
  storeSlug: string;
  initialReview: ExistingReview | null;
  googleReviewUrl: string | null;
}) {
  const [review, setReview] = useState(initialReview);
  const [editing, setEditing] = useState(!initialReview);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [message, setMessage] = useState(initialReview?.message ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitReviewAction(storeSlug, { rating, message });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReview({ rating, message: message.trim() || null });
      setEditing(false);
      toast.success("Thanks for the rating!");
    });
  }

  if (!editing && review) {
    return (
      <div className="flex flex-col gap-3 rounded-md border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5 text-primary">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} className="size-4" fill={i < review.rating ? "currentColor" : "none"} />
              ))}
            </span>
            <span className="text-muted-foreground">Your rating</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRating(review.rating);
              setMessage(review.message ?? "");
              setEditing(true);
            }}
          >
            Change
          </Button>
        </div>
        {googleReviewUrl && (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            Also post this rating on Google
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <p className="text-sm font-medium">Rate your visit</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="text-primary"
            >
              <StarIcon className="size-6" fill={value <= rating ? "currentColor" : "none"} />
            </button>
          );
        })}
      </div>

      <Textarea
        placeholder="Add a comment (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <Button size="sm" onClick={handleSubmit} disabled={rating === 0 || isPending} className="w-fit">
        {isPending ? "Submitting..." : "Submit rating"}
      </Button>
    </div>
  );
}
