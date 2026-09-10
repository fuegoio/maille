import { z } from "zod";

import { chatCompletion, LlmError, type FetchLike, type LlmTool } from "./llm";

/**
 * One-shot movement extraction: the user pastes text (a statement, an
 * email, an HTML page) and the model returns a structured movement list
 * through a forced tool call. Pure except for the LLM request itself:
 * no state, no persistence.
 */

export const MAX_EXTRACTION_LENGTH = 100_000;

export class ExtractionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionInputError";
  }
}

export type ExtractedMovement = {
  name: string;
  date: Date;
  amount: number;
};

export type ExtractionResult = {
  movements: ExtractedMovement[];
  dropped: number;
};

export const SYSTEM_PROMPT = `You are Maille's movement extraction assistant. Your task: read a pasted document (plain text, a bank statement, an email, or an HTML page) and extract every bank movement it contains as a structured list.

Rules:
- Extract every individual movement line: its name, its date and its signed amount. Expenses are negative, income is positive.
- Dates must be formatted as yyyy-MM-dd. When the document shows a day/month without a year, infer the year from the surrounding context in the document; otherwise use the current year.
- The name is the raw label of the movement (merchant, transfer reference, label). Keep it close to the source text. Do not include the date or the amount in the name, and strip standalone technical noise (transaction ids, card numbers) when it is clearly separate from the label.
- Amounts are plain numbers in the document's currency. Interpret thousands separators and decimal commas correctly ("1.234,56" and "1,234.56" are both 1234.56). Do not invent currency conversions.
- Do not extract totals, balances, or column headers. Only individual movements.
- Never guess: skip a line you cannot read confidently rather than inventing values.
- If the document contains no movements, return an empty list.`;

export const EXTRACT_MOVEMENTS_TOOL: LlmTool = {
  name: "extract_movements",
  description:
    "Return every movement (bank line) found in the provided document as a structured list.",
  parameters: {
    type: "object",
    properties: {
      movements: {
        type: "array",
        description: "The movements found, in the order they appear in the document",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Raw movement label" },
            date: { type: "string", description: "Movement date, yyyy-MM-dd" },
            amount: {
              type: "number",
              description: "Signed amount; negative for expenses",
            },
          },
          required: ["name", "date", "amount"],
        },
      },
    },
    required: ["movements"],
  },
};

const isCalendarDate = (dateString: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day!));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day
  );
};

const MovementArgs = z.object({
  name: z
    .string()
    .transform((name) => name.trim())
    .pipe(z.string().min(1)),
  date: z.string(),
  amount: z.number().finite(),
});

/**
 * Strips what the model never needs (scripts, styles, HTML comments) and
 * collapses whitespace runs, without touching the document's structure:
 * HTML tables reach the model as-is so column alignment is preserved.
 */
export function sanitizeInput(text: string): string {
  return text
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractMovements(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  text: string;
  fetchFn?: FetchLike;
}): Promise<ExtractionResult> {
  const sanitized = sanitizeInput(params.text);
  if (sanitized.length === 0) {
    throw new ExtractionInputError("The text is empty");
  }
  if (sanitized.length > MAX_EXTRACTION_LENGTH) {
    throw new ExtractionInputError(
      `The text is too long (${sanitized.length} characters, max ${MAX_EXTRACTION_LENGTH})`,
    );
  }

  const response = await chatCompletion({
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    model: params.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: sanitized },
    ],
    tools: [EXTRACT_MOVEMENTS_TOOL],
    toolChoice: "extract_movements",
    timeoutMs: params.timeoutMs,
    fetchFn: params.fetchFn,
  });

  const call = response.toolCalls.find((toolCall) => toolCall.name === "extract_movements");
  if (!call) {
    throw new LlmError("The model did not return a movement extraction");
  }

  const rawMovements = call.args.movements;
  if (!Array.isArray(rawMovements)) {
    throw new LlmError("The model returned a malformed movement extraction");
  }

  // UTC midnight so the date round-trips through serialization regardless
  // of the server's timezone.
  const movements: ExtractedMovement[] = [];
  let dropped = 0;

  for (const raw of rawMovements) {
    const parsed = MovementArgs.safeParse(raw);
    if (!parsed.success || !isCalendarDate(parsed.data.date)) {
      dropped += 1;
      continue;
    }
    movements.push({
      name: parsed.data.name,
      date: new Date(`${parsed.data.date}T00:00:00Z`),
      amount: parsed.data.amount,
    });
  }

  return { movements, dropped };
}
