import Color from "colorjs.io";

/** Lightness the darkest shade of a ramp reaches. */
const DARKEST = 0.3;

/** Number of swatches in a ramp: the anchor plus its darker shades. */
const SHADE_COUNT = 12;

/** Largest chroma up to `chroma` keeping oklch(L, c, hue) inside sRGB. */
function maxInGamutChroma(L: number, chroma: number, hue: number): number {
  if (new Color("oklch", [L, chroma, hue]).inGamut("srgb")) return chroma;
  let low = 0;
  let high = chroma;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    if (new Color("oklch", [L, mid, hue]).inGamut("srgb")) low = mid;
    else high = mid;
  }
  return low;
}

/**
 * Shade ramp for a hue anchor: the anchor itself first, then progressively
 * darker shades of the same OKLCH hue, chroma capped at the anchor's own and
 * reduced where needed to stay in sRGB gamut.
 */
export function shadeRamp(anchorHex: string): string[] {
  const anchor = new Color(anchorHex).to("oklch");
  const L = anchor.coords[0] ?? 0;
  const chroma = anchor.coords[1] ?? 0;
  const hue = anchor.coords[2] ?? 0;
  const shades = [anchorHex.toLowerCase()];
  for (let i = 1; i < SHADE_COUNT; i++) {
    const step = L - (i * (L - DARKEST)) / (SHADE_COUNT - 1);
    shades.push(
      new Color("oklch", [
        step,
        maxInGamutChroma(step, chroma, hue),
        hue,
      ]).toString({
        format: "hex",
      }),
    );
  }
  return shades;
}

/** Check mark color that stays readable on both ends of a shade ramp. */
export function swatchCheckColor(color: string): string {
  const L = new Color(color).to("oklch").coords[0] ?? 0;
  return L > 0.7 ? "oklch(0.26 0 0)" : "#ffffff";
}
