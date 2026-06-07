import { describe, expect, it } from "vitest";

import { extractDateFromMovementName } from "./date";

describe("extractDateFromMovementName", () => {
  it("should extract DD/MM/YY format date", () => {
    const result = extractDateFromMovementName(
      "CARTE 03/04/26 GRANDE MAISON CB*4071",
    );
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(3);
    expect(result?.getMonth()).toBe(3); // April is month 3 (0-indexed)
    expect(result?.getFullYear()).toBe(2026);
  });

  it("should extract DD/MM/YYYY format date", () => {
    const result = extractDateFromMovementName("Invoice 15/03/2024 Client");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should extract YYYY-MM-DD format date", () => {
    const result = extractDateFromMovementName("Payment 2024-03-15-1234");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should extract DD-MM-YYYY format date", () => {
    const result = extractDateFromMovementName("Bill 15-03-2024");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should handle D/M/YYYY format", () => {
    const result = extractDateFromMovementName("Payment 1/4/2024");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(3); // April is month 3 (0-indexed)
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should handle D/M/YY format", () => {
    const result = extractDateFromMovementName("Doc 3/4/26");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(3);
    expect(result?.getMonth()).toBe(3); // April is month 3 (0-indexed)
    expect(result?.getFullYear()).toBe(2026);
  });

  it("should return null when no date is found", () => {
    const result = extractDateFromMovementName("No date in this string");
    expect(result).toBeNull();
  });

  it("should return null for invalid date", () => {
    const result = extractDateFromMovementName("Invalid 99/99/99");
    expect(result).toBeNull();
  });

  it("should handle date at the beginning of string", () => {
    const result = extractDateFromMovementName("03/04/26 CARTE GRANDE MAISON");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(3);
    expect(result?.getMonth()).toBe(3);
    expect(result?.getFullYear()).toBe(2026);
  });

  it("should handle date at the end of string", () => {
    const result = extractDateFromMovementName("CARTE GRANDE MAISON 03/04/26");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(3);
    expect(result?.getMonth()).toBe(3);
    expect(result?.getFullYear()).toBe(2026);
  });

  it("should handle DD/MM/YY at start of string", () => {
    const result = extractDateFromMovementName("01/01/25 Test");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(0); // January is month 0 (0-indexed)
    expect(result?.getFullYear()).toBe(2025);
  });

  it("should handle historical 2-digit year (before 2000)", () => {
    // Year 99 should be interpreted as 1999 since 2099 is far in the future
    const result = extractDateFromMovementName("Doc 01/01/99");
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(0); // January is month 0 (0-indexed)
    expect(result?.getFullYear()).toBe(1999);
  });
});
