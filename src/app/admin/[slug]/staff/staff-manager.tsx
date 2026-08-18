"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isDevTestPhone } from "@/lib/phone";
import { inviteStaffAction, removeStaffAction } from "./actions";

type MemberRow = { id: string; phone: string | null; name: string | null; role: "ADMIN" | "STAFF" };

export function StaffManager({
  slug,
  members,
  currentMemberId,
}: {
  slug: string;
  members: MemberRow[];
  currentMemberId: string;
}) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    startTransition(async () => {
      const result = await inviteStaffAction(slug, phone, role);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPhone("");
      toast.success(role === "ADMIN" ? "Admin added" : "Staff member added");
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeStaffAction(slug, id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add to your team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="staff-phone">Phone number</Label>
            <Input
              id="staff-phone"
              inputMode="tel"
              placeholder="050 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              They log in with this number and land on their own dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="staff-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole((v as "ADMIN" | "STAFF") ?? "STAFF")}>
              <SelectTrigger id="staff-role" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "ADMIN" ? "Full access, same as you." : "Sees only their own calendar and bookings."}
            </p>
          </div>
          <Button
            onClick={handleInvite}
            disabled={isPending || (!isDevTestPhone(phone) && phone.trim().length < 9)}
            className="h-12 text-base"
          >
            Add to team
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {members.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No team members yet.</p>
        )}
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <Link href={`/admin/${slug}/staff/${member.id}`} className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarFallback>{(member.name ?? member.phone ?? "??").slice(-2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{member.name ?? "Unnamed"}</p>
                <p className="text-sm text-muted-foreground">{member.phone}</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={member.role === "ADMIN" ? "default" : "outline"}>
                {member.role === "ADMIN" ? "Admin" : "Staff"}
              </Badge>
              {member.id !== currentMemberId && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(member.id)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
