import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-semibold tracking-tight">
          Schedule<span className="text-primary">.az</span>
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
    </main>
  );
}
