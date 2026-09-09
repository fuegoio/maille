import { parse } from "date-fns";

/**
 * Extracts a date from a movement name string.
 * Tries multiple date patterns and formats.
 * For 2-digit years, assumes 2000 + year (e.g., 26 -> 2026).
 * For day/month patterns without a year (e.g. "19/08"), the year is taken
 * from `referenceDate` (defaults to the current year).
 * Returns the parsed Date object or null if no valid date is found.
 */
export function extractDateFromMovementName(name: string, referenceDate?: Date): Date | null {
  const refYear = (referenceDate ?? new Date()).getFullYear();

  const datePatterns: {
    regex: RegExp;
    formats: string[];
    yearless?: boolean;
  }[] = [
    { regex: /(\d{1,2}\/\d{1,2}\/\d{4})/, formats: ["dd/MM/yyyy", "d/M/yyyy"] },
    { regex: /(\d{2}\/\d{2}\/\d{2})/, formats: ["dd/MM/yy"] },
    { regex: /(\d{1,2}\/\d{1,2}\/\d{2})/, formats: ["d/M/yy"] },
    { regex: /(\d{4}-\d{2}-\d{2})/, formats: ["yyyy-MM-dd"] },
    { regex: /(\d{2}-\d{2}-\d{4})/, formats: ["dd-MM-yyyy"] },
    { regex: /(\d{1,2}-\d{1,2}-\d{4})/, formats: ["d-M-yyyy"] },
    // Day/month without year — must come after the patterns above so that
    // "19/08/2024" is not partially matched as "19/08".
    { regex: /\b(\d{1,2})\/(\d{1,2})\b/, formats: ["dd/MM"], yearless: true },
  ];

  for (const { regex, formats, yearless } of datePatterns) {
    const match = name.match(regex);
    if (match) {
      if (yearless) {
        const day = parseInt(match[1]!, 10);
        const month = parseInt(match[2]!, 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          const parsedDate = new Date(refYear, month - 1, day);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
        continue;
      }

      const dateString = match[1];
      if (!dateString) continue;

      for (const dateFormat of formats) {
        const parsedDate = parse(dateString, dateFormat, new Date());
        if (!isNaN(parsedDate.getTime())) {
          // Fix 2-digit years (date-fns parses "26" as year 0026)
          const year = parsedDate.getFullYear();
          if (year < 100) {
            // Assume 2000 + year for dates in the current era
            const fixedYear = 2000 + year;
            // Check if the fixed year makes sense (not in the future by more than a few years)
            const currentYear = new Date().getFullYear();
            if (fixedYear <= currentYear + 2) {
              parsedDate.setFullYear(fixedYear);
            } else {
              parsedDate.setFullYear(1900 + year);
            }
          }
          return parsedDate;
        }
      }
    }
  }

  return null;
}
