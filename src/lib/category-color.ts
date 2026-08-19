const GUARD_COUNT = 5;

// Stable per-category color so the same category always draws the same
// guard-band across the directory, without needing a maintained enum —
// Store.category is free text entered by real owners.
export function categoryGuardVar(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  const index = (Math.abs(hash) % GUARD_COUNT) + 1;
  return `var(--guard-${index})`;
}
