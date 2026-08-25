import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AVATAR_DIR = path.join(process.cwd(), "storage", "avatars");

// Public, same as /api/logos: an avatar shows up wherever a user is named
// (booking rows, staff lists) to people who aren't necessarily that user.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarMimeType: true },
  });
  if (!user?.avatarMimeType) {
    return NextResponse.json({ error: "No avatar" }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(AVATAR_DIR, userId));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": user.avatarMimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No avatar" }, { status: 404 });
  }
}
