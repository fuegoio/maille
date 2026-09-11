import { describe, expect, it } from "vitest";

import { detectDelimiter, parseRecords } from "./csv";

describe("detectDelimiter", () => {
  it("detects the most frequent delimiter on the header line", () => {
    expect(detectDelimiter("Date;Label;Amount\n2026-01-02;Coffee;-7,90")).toBe(
      ";",
    );
    expect(detectDelimiter("Date,Label,Amount\n2026-01-02,Coffee,7.90")).toBe(
      ",",
    );
    expect(
      detectDelimiter("Date\tLabel\tAmount\n2026-01-02\tCoffee\t7.90"),
    ).toBe("\t");
  });

  it("prefers semicolon on a tie", () => {
    expect(detectDelimiter("Date,Label;Amount\n")).toBe(";");
  });

  it("uses the first non-empty line", () => {
    expect(detectDelimiter("\n\nDate;Label\n;value")).toBe(";");
  });

  it("falls back to semicolon for empty text", () => {
    expect(detectDelimiter("")).toBe(";");
  });
});

describe("parseRecords", () => {
  it("keeps decimal-comma values whole in auto mode", () => {
    const csv = "Date;Label;Amount\n2026-01-02;Coffee;-7,90\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { Date: "2026-01-02", Label: "Coffee", Amount: "-7,90" },
    ]);
  });

  it("keeps quoted thousands-separator amounts whole", () => {
    const csv = 'Date;Label;Amount\n2026-01-02;Transfer;"-1 000,00"\n';
    expect(parseRecords(csv, "auto")[0]["Amount"]).toBe("-1 000,00");
  });

  it("parses comma-delimited files and protects quoted commas", () => {
    const csv = 'Date,Label,Amount\n2026-01-02,"Coffee, large",-3.50\n';
    expect(parseRecords(csv, "auto")).toEqual([
      { Date: "2026-01-02", Label: "Coffee, large", Amount: "-3.50" },
    ]);
  });

  it("parses tab-delimited files", () => {
    const csv = "Date\tLabel\tAmount\n2026-01-02\tCoffee\t-7,90\n";
    expect(parseRecords(csv, "auto")[0]["Amount"]).toBe("-7,90");
  });

  it("uses the explicit delimiter instead of detecting one", () => {
    const csv = "a,b;c\nd,e;f\n";
    // auto would detect comma here, but explicit semicolon wins
    expect(parseRecords(csv, "semicolon")).toEqual([{ "a,b": "d,e", c: "f" }]);
  });

  it("strips the byte order mark from the header", () => {
    const csv = "\uFEFFDate;Label;Amount\n2026-01-02;Coffee;-7,90\n";
    expect(Object.keys(parseRecords(csv, "auto")[0])).toEqual([
      "Date",
      "Label",
      "Amount",
    ]);
  });

  it("skips empty lines", () => {
    const csv = "Date;Label;Amount\n\n2026-01-02;Coffee;-7,90\n\n";
    expect(parseRecords(csv, "auto")).toHaveLength(1);
  });

  it("handles a BoursoBank-style export end to end", () => {
    const csv =
      '"Date Opération";"Libellé Suggéré";Value;Solde;Pointage\n' +
      '2026-09-08;"CARTE 07/09/26 CB*4071";-7,90;2426.61;Non\n' +
      '2026-09-08;"VIR INST";"-1 000,00";2426.61;Non\n';
    const records = parseRecords(csv, "auto");
    expect(records).toHaveLength(2);
    expect(records[0]["Value"]).toBe("-7,90");
    expect(records[1]["Value"]).toBe("-1 000,00");
    expect(records[0]["Solde"]).toBe("2426.61");
  });
});
