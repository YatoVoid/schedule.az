import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions";

export function SiteHeader({
  loggedIn,
  showAccountLink = true,
}: {
  loggedIn: boolean;
  showAccountLink?: boolean;
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Schedule<span className="text-primary">.az</span>
        </Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <>
              {showAccountLink && (
                <Button render={<Link href="/account" />} nativeButton={false} variant="ghost" size="sm">
                  My account
                </Button>
              )}
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button render={<Link href="/login?next=/account" />} nativeButton={false} variant="ghost" size="sm">
              Log in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
