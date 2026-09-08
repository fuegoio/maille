import Color from "colorjs.io";

/** Lightness steps of a shade ramp, light to dark. */
const SHADE_STEPS = [
  0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35,
];

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
 * Shade ramp for a hue anchor: the anchor's OKLCH hue and chroma at fixed
 * lightness steps, chroma reduced where needed to stay in sRGB gamut. The
 * anchor itself replaces the step closest to its lightness, so an existing
 * selection keeps its exact swatch in the ramp.
 */
export function shadeRamp(anchorHex: string): string[] {
  const anchor = new Color(anchorHex).to("oklch");
  const L = anchor.coords[0] ?? 0;
  const chroma = anchor.coords[1] ?? 0;
  const hue = anchor.coords[2] ?? 0;
  const shades = SHADE_STEPS.map((step) =>
    new Color("oklch", [
      step,
      maxInGamutChroma(step, chroma, hue),
      hue,
    ]).toString({
      format: "hex",
    }),
  );
  let nearest = 0;
  for (let i = 1; i < SHADE_STEPS.length; i++) {
    if (Math.abs(SHADE_STEPS[i] - L) < Math.abs(SHADE_STEPS[nearest] - L))
      nearest = i;
  }
  shades[nearest] = anchorHex.toLowerCase();
  return shades;
}

/** Check mark color that stays readable on both ends of a shade ramp. */
export function swatchCheckColor(color: string): string {
  const L = new Color(color).to("oklch").coords[0] ?? 0;
  return L > 0.7 ? "oklch(0.26 0 0)" : "#ffffff";
}
