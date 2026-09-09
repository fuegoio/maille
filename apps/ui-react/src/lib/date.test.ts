import { extractDateFromMovementName } from "@maille/core/movements";
import { describe, expect, it } from "vitest";

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

  it("should extract DD/MM without year using referenceDate", () => {
    const ref = new Date(2024, 5, 1); // June 2024
    const result = extractDateFromMovementName("CARTE 19/08 RESTAURANT", ref);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(19);
    expect(result?.getMonth()).toBe(7); // August is month 7 (0-indexed)
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should extract D/M without year using referenceDate", () => {
    const ref = new Date(2025, 0, 15); // January 2025
    const result = extractDateFromMovementName("PRLV 3/9 BOULANGER", ref);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(3);
    expect(result?.getMonth()).toBe(8); // September is month 8 (0-indexed)
    expect(result?.getFullYear()).toBe(2025);
  });

  it("should prefer full date over DD/MM when both present", () => {
    const ref = new Date(2024, 0, 1);
    const result = extractDateFromMovementName(
      "CB 15/03/2024 OTHER 19/08",
      ref,
    );
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(2); // March
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should return null for DD/MM with invalid month", () => {
    const result = extractDateFromMovementName("Doc 15/13");
    expect(result).toBeNull();
  });

  it("should not match DD/MM inside a longer date pattern", () => {
    const ref = new Date(2024, 0, 1);
    const result = extractDateFromMovementName("Payment 19/08/2024", ref);
    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(19);
    expect(result?.getMonth()).toBe(7);
    expect(result?.getFullYear()).toBe(2024);
  });
});
