/**
 * A dated observation of a value — the shared shape behind investment
 * unit prices and asset estimated values. The series is unordered on
 * input: "latest" is by date, never by array position.
 */
export type DatedValue = {
  date: Date;
  value: number;
};

/**
 * The latest point at or before `at`, or null when the series holds no
 * point at or before it. Generic over the point: investments expose
 * `price`, asset estimates expose `value` — only the date is shared.
 * Points after `at` are invisible: a future price is a prevision, not
 * a valuation.
 */
export function latestValueAt<T extends { date: Date }>(series: readonly T[], at: Date): T | null {
  let latest: T | null = null;
  for (const point of series) {
    if (
      point.date.getTime() <= at.getTime() &&
      (latest === null || point.date.getTime() > latest.date.getTime())
    ) {
      latest = point;
    }
  }
  return latest;
}

/** The series sorted oldest first — the reading order of a timeline. */
export function valueSeriesSorted<T extends { date: Date }>(series: readonly T[]): T[] {
  return [...series].sort((a, b) => a.date.getTime() - b.date.getTime());
}
