export type RatingSummary = { average: number; count: number };

export function summarizeRatings(ratings: number[]): RatingSummary | null {
  if (ratings.length === 0) return null;
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return { average, count: ratings.length };
}
