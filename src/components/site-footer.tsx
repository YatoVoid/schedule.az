import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto px-4 pb-24 sm:pb-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-t pt-4 font-mono text-xs text-muted-foreground">
        <span>Schedule.az</span>
        <span className="flex items-center gap-3">
          <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
            Terms
          </Link>
        </span>
      </div>
    </footer>
  );
}
