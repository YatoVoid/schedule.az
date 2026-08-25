// Trusts the declared File.type only as a hint; this checks the actual
// leading bytes so a renamed non-image can't ride an image/* Content-Type
// past validation before we write it to disk and serve it back later.
const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/png": (b) =>
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) =>
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

export function matchesImageSignature(declaredType: string, bytes: Uint8Array): boolean {
  const check = SIGNATURES[declaredType];
  return check ? check(bytes) : false;
}
