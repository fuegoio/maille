import { describe, expect, it } from "vitest";

import {
  extractMovements,
  ExtractionInputError,
  MAX_EXTRACTION_LENGTH,
  sanitizeInput,
} from "../src/extract-movements";
import { LlmError } from "../src/llm";

const extractionBody = (movements: unknown) => ({
  choices: [
    {
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call-1",
            type: "function",
            function: { name: "extract_movements", arguments: JSON.stringify({ movements }) },
          },
        ],
      },
    },
  ],
  usage: { prompt_tokens: 100, completion_tokens: 20 },
});

const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("sanitizeInput", () => {
  it("strips scripts, styles and HTML comments", () => {
    const sanitized = sanitizeInput(
      '<table><tr><td>CB 19/08 -12,50</td></tr></table><script>alert("x")</script><style>.a{}</style><!-- footer -->',
    );
    expect(sanitized).toBe("<table><tr><td>CB 19/08 -12,50</td></tr></table>");
  });

  it("collapses whitespace runs but keeps line structure", () => {
    expect(sanitizeInput("a   b\t\tc\n\n\n\nd")).toBe("a b c\n\nd");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });
});

describe("extractMovements", () => {
  const params = {
    baseUrl: "https://api.mistral.ai/v1",
    apiKey: "test-key",
    model: "z-ai-glm-5-3",
    timeoutMs: 5000,
  };

  it("extracts movements through the forced tool call", async () => {
    const result = await extractMovements({
      ...params,
      text: "CB 19/08/2024 -12,50\nSalaire 01/09/2024 2500",
      fetchFn: async () =>
        okResponse(
          extractionBody([
            { name: "CB", date: "2024-08-19", amount: -12.5 },
            { name: "Salaire", date: "2024-09-01", amount: 2500 },
          ]),
        ),
    });

    expect(result.dropped).toBe(0);
    expect(result.movements).toEqual([
      { name: "CB", date: new Date("2024-08-19T00:00:00Z"), amount: -12.5 },
      { name: "Salaire", date: new Date("2024-09-01T00:00:00Z"), amount: 2500 },
    ]);
  });

  it("drops invalid rows and counts them", async () => {
    const result = await extractMovements({
      ...params,
      text: "statement",
      fetchFn: async () =>
        okResponse(
          extractionBody([
            { name: "Valid", date: "2024-08-19", amount: -12.5 },
            { name: "  ", date: "2024-08-20", amount: 1 }, // empty name
            { name: "Bad date", date: "19/08/2024", amount: 1 }, // not yyyy-MM-dd
            { name: "Impossible", date: "2024-02-30", amount: 1 }, // not a calendar date
            { name: "Not a number", date: "2024-08-21", amount: "1" }, // wrong type
          ]),
        ),
    });

    expect(result.dropped).toBe(4);
    expect(result.movements.map((movement) => movement.name)).toEqual(["Valid"]);
  });

  it("returns an empty list when the model finds nothing", async () => {
    const result = await extractMovements({
      ...params,
      text: "no movements here",
      fetchFn: async () => okResponse(extractionBody([])),
    });

    expect(result).toEqual({ movements: [], dropped: 0 });
  });

  it("rejects empty input", async () => {
    await expect(
      extractMovements({
        ...params,
        text: "   \n  ",
        fetchFn: async () => okResponse(extractionBody([])),
      }),
    ).rejects.toBeInstanceOf(ExtractionInputError);
  });

  it("rejects input over the length cap", async () => {
    await expect(
      extractMovements({
        ...params,
        text: "a".repeat(MAX_EXTRACTION_LENGTH + 1),
        fetchFn: async () => okResponse(extractionBody([])),
      }),
    ).rejects.toBeInstanceOf(ExtractionInputError);
  });

  it("fails when the model returns no extraction tool call", async () => {
    await expect(
      extractMovements({
        ...params,
        text: "statement",
        fetchFn: async () =>
          okResponse({
            choices: [{ message: { role: "assistant", content: "cannot read this" } }],
          }),
      }),
    ).rejects.toBeInstanceOf(LlmError);
  });

  it("fails when the tool arguments are malformed", async () => {
    await expect(
      extractMovements({
        ...params,
        text: "statement",
        fetchFn: async () =>
          okResponse({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "call-1",
                      type: "function",
                      function: { name: "extract_movements", arguments: '{"movements": "nope"}' },
                    },
                  ],
                },
              },
            ],
          }),
      }),
    ).rejects.toBeInstanceOf(LlmError);
  });
});
