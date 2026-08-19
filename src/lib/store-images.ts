export type StoreImageRef = { id: string; createdAt: Date | string };

export function storeImageUrl(storeId: string, image: StoreImageRef): string {
  const v = new Date(image.createdAt).getTime();
  return `/api/store-images/${storeId}/${image.id}?v=${v}`;
}
