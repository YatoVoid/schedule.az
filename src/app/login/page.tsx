import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { BackLink } from "@/components/back-link";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <main className="flex min-h-screen flex-1">
      {/* Brand panel: desktop only, matches the sira-benchmarked split-screen
          pattern but in our own palette and with copy that's true today
          (real Baku categories, the business confirms each booking), not borrowed
          marketing language. */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card p-1.5">
            <Image src="/logo-mark.png" alt="" width={28} height={28} className="size-7" />
          </span>
          <span className="font-heading text-lg font-medium">Schedule.az</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-6xl leading-[0.95] tracking-tight">
            Book your next
            <br />
            <em className="text-blossom">appointment in Baku.</em>
          </h1>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Barbershops, salons, spas and more, confirmed by the business, no back-and-forth over WhatsApp.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-secondary/40 px-4 py-12">
        <div className="w-full max-w-sm">
          <BackLink />
          <Link
            href="/"
            className="mb-8 flex flex-col items-center gap-2 text-center text-xl font-semibold tracking-tight lg:hidden"
          >
            <Image src="/logo-mark.png" alt="" width={44} height={44} className="size-11" />
            <span>
              Schedule<span className="text-primary">.az</span>
            </span>
          </Link>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm next={nextPath} />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Same login for business owners, staff and customers, just your phone number.
          </p>
        </div>
      </div>
    </main>
  );
}
