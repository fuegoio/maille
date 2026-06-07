import { format, parse } from "date-fns";

export function getGraphQLDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Extracts a date from a movement name string.
 * Tries multiple date patterns and formats.
 * For 2-digit years, assumes 2000 + year (e.g., 26 -> 2026).
 * Returns the parsed Date object or null if no valid date is found.
 */
export function extractDateFromMovementName(name: string): Date | null {
  const datePatterns = [
    { regex: /(\d{1,2}\/\d{1,2}\/\d{4})/, formats: ["dd/MM/yyyy", "d/M/yyyy"] },
    { regex: /(\d{2}\/\d{2}\/\d{2})/, formats: ["dd/MM/yy"] },
    { regex: /(\d{1,2}\/\d{1,2}\/\d{2})/, formats: ["d/M/yy"] },
    { regex: /(\d{4}-\d{2}-\d{2})/, formats: ["yyyy-MM-dd"] },
    { regex: /(\d{2}-\d{2}-\d{4})/, formats: ["dd-MM-yyyy"] },
    { regex: /(\d{1,2}-\d{1,2}-\d{4})/, formats: ["d-M-yyyy"] },
  ];

  for (const { regex, formats } of datePatterns) {
    const match = name.match(regex);
    if (match) {
      const dateString = match[1];

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
