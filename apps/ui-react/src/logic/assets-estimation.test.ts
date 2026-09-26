import type { Asset, AssetValuation } from "@maille/core/accounts";

import { describe, expect, it } from "vitest";

import { getAssetsAccountEstimation } from "./assets";

const asset = (overrides: Partial<Asset> & Pick<Asset, "id">): Asset => ({
  account: "acc-assets",
  name: "Test",
  description: null,
  location: null,
  ...overrides,
});

const valuation = (
  overrides: Partial<AssetValuation> & Pick<AssetValuation, "id">,
): AssetValuation => ({
  asset: "asset-1",
  date: new Date("2026-01-15"),
  value: 1000,
  ...overrides,
});

const at = new Date("2026-02-01");

describe("getAssetsAccountEstimation", () => {
  it("is null when the account holds no asset", () => {
    expect(getAssetsAccountEstimation([], [], "acc-assets", at)).toBeNull();
  });

  it("is null when no asset has ever been valued", () => {
    expect(
      getAssetsAccountEstimation(
        [asset({ id: "asset-1" })],
        [],
        "acc-assets",
        at,
      ),
    ).toBeNull();
  });

  it("sums latest estimated values at or before the date", () => {
    const estimation = getAssetsAccountEstimation(
      [asset({ id: "asset-1" }), asset({ id: "asset-2" })],
      [
        valuation({
          id: "v1",
          asset: "asset-1",
          date: new Date("2026-01-15"),
          value: 1000,
        }),
        valuation({
          id: "v2",
          asset: "asset-2",
          date: new Date("2026-01-20"),
          value: 2500,
        }),
      ],
      "acc-assets",
      at,
    );
    expect(estimation).toEqual({
      value: 3500,
      valued: 2,
      positions: 2,
      asOf: new Date("2026-01-20"),
    });
  });

  it("ignores future observations and counts unvalued assets", () => {
    const estimation = getAssetsAccountEstimation(
      [asset({ id: "asset-1" }), asset({ id: "asset-2" })],
      [
        valuation({
          id: "v1",
          asset: "asset-1",
          date: new Date("2026-01-15"),
          value: 1000,
        }),
        valuation({
          id: "v2",
          asset: "asset-1",
          date: new Date("2026-03-01"),
          value: 999,
        }),
      ],
      "acc-assets",
      at,
    );
    expect(estimation).toEqual({
      value: 1000,
      valued: 1,
      positions: 2,
      asOf: new Date("2026-01-15"),
    });
  });
});
