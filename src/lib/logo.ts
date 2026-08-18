export function storeLogoUrl(storeId: string, logoUpdatedAt: Date | string | null): string | null {
  if (!logoUpdatedAt) return null;
  const v = new Date(logoUpdatedAt).getTime();
  return `/api/logos/${storeId}?v=${v}`;
}
