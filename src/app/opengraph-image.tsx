import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const IVORY = "#F8F2EB";
const MADDER = "#A12623";
const INK = "#201914";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo-mark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: IVORY,
          padding: "0 90px",
          gap: 56,
        }}
      >
        <img src={logoSrc} width={180} height={180} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 140, height: 4, background: MADDER, marginBottom: 28 }} />
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: INK, letterSpacing: -2 }}>
            Schedule<span style={{ color: MADDER }}>.az</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: INK, opacity: 0.72, marginTop: 16, maxWidth: 760 }}>
            Booking for Baku&apos;s service businesses
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
