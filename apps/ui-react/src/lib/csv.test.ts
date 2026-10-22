import { describe, expect, it } from "vitest";

import { detectDelimiter, parseAmountValue, parseRecords } from "./csv";

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

describe("parseAmountValue", () => {
  it("parses decimal commas", () => {
    expect(parseAmountValue("-7,90")).toBe(-7.9);
  });

  it("strips thousands separators, including non-breaking ones", () => {
    expect(parseAmountValue("-1 806,10")).toBe(-1806.1);
    expect(parseAmountValue("57\u00A0498,00")).toBe(57498);
    expect(parseAmountValue("-1\u202F806,10")).toBe(-1806.1);
    expect(parseAmountValue("1 000.50")).toBe(1000.5);
  });

  it("returns NaN for non-numeric values", () => {
    expect(parseAmountValue("")).toBeNaN();
    expect(parseAmountValue("Non")).toBeNaN();
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

  it("keeps both columns when the header row repeats a title", () => {
    const csv = "Date;Montant;Montant\n2026-01-02;-7,90;-1 000,00\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { Date: "2026-01-02", Montant: "-7,90", "Montant (2)": "-1 000,00" },
    ]);
  });

  it("numbers three or more repeated titles", () => {
    const csv = "A;A;A;B\n1;2;3;4\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { A: "1", "A (2)": "2", "A (3)": "3", B: "4" },
    ]);
  });

  it("does not collide with a column already suffixed in the file", () => {
    const csv = "A;A;A (2)\n1;2;3\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { A: "1", "A (2)": "2", "A (3)": "3" },
    ]);
  });

  it("leaves repeated unnamed columns hidden but harmless", () => {
    const csv = "Date;;Montant;\n2026-01-02;;-7,90;\n";
    const [record] = parseRecords(csv, "auto");
    expect(record.Date).toBe("2026-01-02");
    expect(record.Montant).toBe("-7,90");
  });

  it("treats titles differing only by whitespace as duplicates", () => {
    const csv = "Montant; Montant \n1;2\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { Montant: "1", "Montant (2)": "2" },
    ]);
  });

  it("pads short rows with empty strings", () => {
    const csv = "Date;Label;Amount\n2026-01-02;Coffee\n";
    expect(parseRecords(csv, "auto")).toEqual([
      { Date: "2026-01-02", Label: "Coffee", Amount: "" },
    ]);
  });
});
