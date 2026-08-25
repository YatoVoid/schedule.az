import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { userAvatarUrl } from "@/lib/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSetupForm } from "./profile-setup-form";

export default async function ProfileSetupPage({
  searchParams,
}: PageProps<"/profile-setup">) {
  const user = await requireUser();
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/";

  if (user.username) redirect(nextPath);

  const identifier = user.phone ?? user.email ?? "";

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-heading text-2xl font-medium tracking-tight">
          Choose a username
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          This is how staff and other customers will see you on Schedule.az.
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set up your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileSetupForm
              next={nextPath}
              initialAvatarUrl={userAvatarUrl(user.id, user.avatarUpdatedAt)}
              fallbackInitial={identifier.slice(0, 1).toUpperCase() || "?"}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
