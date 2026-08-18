import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOGO_DIR = path.join(process.cwd(), "storage", "logos");

// Logos are public (they're meant to show on the future store directory
// page), so this route intentionally does no auth check, unlike the
// admin/staff dashboards. cache-control keys off logoUpdatedAt via the
// caller's ?v= query param, not off this route.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { logoMimeType: true },
  });
  if (!store?.logoMimeType) {
    return NextResponse.json({ error: "No logo" }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(LOGO_DIR, storeId));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": store.logoMimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No logo" }, { status: 404 });
  }
}
