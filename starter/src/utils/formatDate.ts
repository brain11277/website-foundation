// Date formatting, with the one thing that reliably goes wrong already fixed.
//
// FOUNDATION.md §3 asks for semantic dates: pair these with
// <time datetime={iso}>{fmtDate(iso)}</time> at every render site, sourced
// from this one formatter so the visible string and the machine-readable
// attribute cannot drift.
//
// timeZone is pinned to UTC and that pin is load-bearing. A bare "YYYY-MM-DD"
// parses as UTC midnight. Formatting it in the build machine's local zone
// rolled every date back a day on a Pacific-time laptop while CI, running in
// UTC, rendered the same input correctly. The bug only appears on a developer
// machine west of Greenwich, which is the worst possible place for it to hide.
// Pinning makes local previews match production.

/** Locale for rendered dates. 'en-GB' gives "30 Apr 2026"; 'en-US' gives "Apr 30, 2026". */
const DATE_LOCALE = 'en-GB';

/**
 * Format an ISO date string for display, e.g. "30 Apr 2026".
 *
 * Day precision is deliberate. A month-and-year string cannot be paired with a
 * full `datetime` attribute without the two disagreeing, and structured data
 * wants the specific day.
 */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Relative time: "just now", "3m ago", "2h ago", "5d ago". Caps at days. */
export function timeSince(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
