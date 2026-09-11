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

export function parseRecords(
  text: string,
  delimiter: DelimiterOption,
): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  return parseCSV(clean, {
    delimiter:
      delimiter === "auto"
        ? detectDelimiter(clean)
        : DELIMITER_VALUES[delimiter],
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}
