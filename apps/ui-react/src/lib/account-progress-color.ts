import { AccountType } from "@maille/core/accounts";
import Color from "colorjs.io";

const BASE_COLORS = {
  [AccountType.BANK_ACCOUNT]: "#818cf8",
  [AccountType.INVESTMENT_ACCOUNT]: "#fb923c",
  [AccountType.CASH]: "#a1a1aa",
  [AccountType.LIABILITIES]: "#38bdf8",
  [AccountType.EXPENSE]: "#fca5a5",
  [AccountType.REVENUE]: "#4ade80",
  [AccountType.ASSETS]: "#a78bfa",
};

/**
 * A shade of the account type's color for stacked distribution bars: the
 * lightness ramps down (70 to 40) as the index advances, so sibling accounts
 * of one type stay distinguishable without leaving the type's hue.
 */
export function getAccountTypeShadeColor(
  accountType: AccountType,
  index: number,
  count: number,
): Color {
  const color = new Color(BASE_COLORS[accountType]);
  color.lch.l = 70 + (index / count) * -30;
  return color;
}
