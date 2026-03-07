import chalk from "chalk";
import { readConfig } from "./config.js";

export function formatCurrency(amount: number): string {
  const currency = readConfig().user?.currency ?? "EUR";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length))
  );

  const fmt = (cells: string[], bold: boolean) =>
    cells.map((c, i) => (bold ? chalk.bold(c.padEnd(widths[i])) : c.padEnd(widths[i]))).join("   ");

  console.log(fmt(headers, true));
  for (const row of rows) {
    console.log(fmt(row, false));
  }
}
