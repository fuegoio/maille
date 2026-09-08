import { FUND_COLORS } from "@maille/core/funds";
import Color from "colorjs.io";
import { describe, expect, it } from "vitest";

import { shadeRamp, swatchCheckColor } from "./fund-colors";

const hexHueDistance = (a: string, b: string) => {
  const hueA = new Color(a).to("oklch").coords[2] ?? 0;
  const hueB = new Color(b).to("oklch").coords[2] ?? 0;
  const d = Math.abs(hueA - hueB) % 360;
  return Math.min(d, 360 - d);
};

describe("shadeRamp", () => {
  it.each(FUND_COLORS)("places %s first in its own ramp", (anchor) => {
    const ramp = shadeRamp(anchor);
    expect(ramp).toHaveLength(12);
    expect(ramp[0]).toBe(anchor);
    expect(ramp.filter((c) => c === anchor)).toHaveLength(1);
  });

  it.each(FUND_COLORS)("produces only hex colors for %s", (anchor) => {
    for (const shade of shadeRamp(anchor)) {
      expect(shade).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(FUND_COLORS)("darkens step by step from %s", (anchor) => {
    const ramp = shadeRamp(anchor);
    for (let i = 1; i < ramp.length; i++) {
      const L = new Color(ramp[i]).to("oklch").coords[0] ?? 0;
      const prev = new Color(ramp[i - 1]).to("oklch").coords[0] ?? 0;
      expect(L).toBeLessThan(prev);
    }
  });

  // Shades are generated at the anchor's exact hue; small drifts come from
  // hex quantization when chroma is clamped at the sRGB gamut boundary.
  it.each(FUND_COLORS)("stays on the hue of %s", (anchor) => {
    for (const shade of shadeRamp(anchor)) {
      expect(hexHueDistance(shade, anchor)).toBeLessThan(2);
    }
  });

  it.each(FUND_COLORS)("stays inside sRGB gamut for %s", (anchor) => {
    for (const shade of shadeRamp(anchor)) {
      expect(new Color(shade).inGamut("srgb")).toBe(true);
    }
  });
});

describe("swatchCheckColor", () => {
  it("uses a dark check on light anchors", () => {
    expect(swatchCheckColor(shadeRamp("#fbbf24")[0])).toBe("oklch(0.26 0 0)");
  });

  it("uses a white check on dark shades", () => {
    const darkest = shadeRamp("#a78bfa").at(-1)!;
    expect(swatchCheckColor(darkest)).toBe("#ffffff");
  });
});
