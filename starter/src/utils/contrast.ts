/**
 * WCAG 2.1 contrast helpers.
 *
 * You need these the moment any color is data rather than a design decision:
 * a brand color on a badge, a tag color from a CMS, a category color someone
 * picks in a form. The ink on top of it cannot be hardcoded. A mid-tone brand
 * blue like #009FDA gives white only 3.01:1, while #0052CC gives it 6.82:1.
 *
 * Also the right home for ratio math when auditing your tokens. Contrast
 * failures cluster just under the threshold (3.18:1, 4.23:1), which is exactly
 * the range where eyeballing it passes and the audit does not. See
 * FOUNDATION.md §4: check a token against the lightest surface it lands on,
 * not just the page background.
 */

/** Relative luminance per WCAG 2.1, from a `#rgb` or `#rrggbb` string. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const channel = (i: number) => {
    const c = parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** Contrast ratio between two hex colors. 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick the ink, white or black, that contrasts better against `background`.
 * Returns the higher-contrast option rather than applying a fixed threshold,
 * so a color where neither choice clears AA still gets the best available.
 */
export function readableInk(background: string): '#FFFFFF' | '#000000' {
  return contrastRatio('#FFFFFF', background) >= contrastRatio('#000000', background)
    ? '#FFFFFF'
    : '#000000';
}

/** True when `fg` on `bg` clears the WCAG AA threshold for normal-size text. */
export function meetsAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}
