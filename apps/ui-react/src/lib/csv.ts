import { parse as parseCSV } from "csv-parse/browser/esm/sync";

export type DelimiterOption = "auto" | "semicolon" | "comma" | "tab";

const DELIMITER_VALUES: Record<Exclude<DelimiterOption, "auto">, string> = {
  semicolon: ";",
  comma: ",",
  tab: "\t",
};

// Auto must resolve to a single delimiter: accepting several at once makes
// csv-parse also split decimal-comma values ("-7,90") into separate fields.
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "");
  if (!firstLine) return ";";
  let best = ";";
  let bestCount = -1;
  for (const candidate of [";", ",", "\t"]) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

// Bank exports format amounts per locale: comma decimals and thousands
// separators that range from plain spaces to non-breaking (U+00A0) or
// narrow no-break spaces (U+202F). parseFloat stops at any of them, so
// strip all whitespace (\s covers every Unicode space) before parsing.
export function parseAmountValue(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(/,/g, "."));
}

// Some banks export the same column title twice. csv-parse's named columns
// would keep only the last occurrence, silently dropping the other's values,
// so the header row is turned into record keys here with a deduplicated name
// per column ("Montant", "Montant (2)", ...).
function uniqueColumnNames(headers: string[]): string[] {
  const used = new Set<string>();
  return headers.map((header) => {
    const base = header.trim();
    // Unnamed columns stay unnamed: the mapping UI hides them anyway, and
    // several of them sharing the "" key is harmless.
    if (base === "") return "";
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    let suffix = 2;
    // Continue the base title's series even when the repeated title already
    // carries a suffix ("A", "A", "A (2)" -> "A (3)") so keys stay readable.
    const series = base.replace(/ \(\d+\)$/, "");
    let candidate = `${series} (${suffix})`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${series} (${suffix})`;
    }
    used.add(candidate);
    return candidate;
  });
}

export function parseRecords(
  text: string,
  delimiter: DelimiterOption,
): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  const rows = parseCSV(clean, {
    delimiter:
      delimiter === "auto"
        ? detectDelimiter(clean)
        : DELIMITER_VALUES[delimiter],
    columns: false,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as string[][];
  if (rows.length === 0) return [];
  const names = uniqueColumnNames(rows[0]);
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    names.forEach((name, i) => {
      record[name] = row[i] ?? "";
    });
    return record;
  });
}
