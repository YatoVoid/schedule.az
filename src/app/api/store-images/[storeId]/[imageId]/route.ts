import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STORE_IMAGE_DIR = path.join(process.cwd(), "storage", "store-images");

// Public, same as logos: these are what the directory homepage cycles
// through, so no auth check. cache-control keys off the ?v= query param.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; imageId: string }> },
) {
  const { storeId, imageId } = await params;

  const image = await prisma.storeImage.findFirst({
    where: { id: imageId, storeId },
    select: { mimeType: true },
  });
  if (!image) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(STORE_IMAGE_DIR, storeId, imageId));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }
}
