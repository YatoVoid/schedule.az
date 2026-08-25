export function userAvatarUrl(userId: string, avatarUpdatedAt: Date | string | null): string | null {
  if (!avatarUpdatedAt) return null;
  const v = new Date(avatarUpdatedAt).getTime();
  return `/api/avatars/${userId}?v=${v}`;
}
