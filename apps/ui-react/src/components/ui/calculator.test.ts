import { describe, expect, it } from "vitest";

import { parseCalculatorExpression } from "./calculator";

describe("parseCalculatorExpression", () => {
  it("converts display operators and decimal separators", () => {
    expect(parseCalculatorExpression("2×3÷4")).toBe("2*3/4");
    expect(parseCalculatorExpression("1,5+2,5")).toBe("1.5+2.5");
  });

  it("converts every occurrence, not just the first", () => {
    expect(parseCalculatorExpression("2×3×4")).toBe("2*3*4");
    expect(parseCalculatorExpression("1,5+2,5+3,5")).toBe("1.5+2.5+3.5");
  });

  it("keeps balanced parentheses untouched", () => {
    expect(parseCalculatorExpression("(1+2)×3")).toBe("(1+2)*3");
    expect(parseCalculatorExpression("(1+2)×(3+4)")).toBe("(1+2)*(3+4)");
  });

  it("auto-closes unclosed parentheses", () => {
    expect(parseCalculatorExpression("(1+2")).toBe("(1+2)");
    expect(parseCalculatorExpression("((1+2)×3")).toBe("((1+2)*3)");
    expect(parseCalculatorExpression("2×(3+4")).toBe("2*(3+4)");
  });

  it("leaves extra closing parentheses alone", () => {
    expect(parseCalculatorExpression("(1+2))")).toBe("(1+2))");
  });

  it("returns the input unchanged when there is nothing to convert", () => {
    expect(parseCalculatorExpression("12+34")).toBe("12+34");
    expect(parseCalculatorExpression("")).toBe("");
  });
});
