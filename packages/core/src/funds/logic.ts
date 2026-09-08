import type { Fund, FundMove } from "./types";

/** Hex colors a fund icon can take, shared by the API default and the UI picker. */
export const FUND_COLORS = [
  "#818cf8", // indigo
  "#60a5fa", // blue
  "#38bdf8", // sky
  "#2dd4bf", // teal
  "#4ade80", // green
  "#a3e635", // lime
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f87171", // red
  "#f472b6", // pink
  "#a78bfa", // violet
  "#e2a4e8" /* plum */,
] as const;

/** Color assigned to funds created without an explicit choice. */
export const DEFAULT_FUND_COLOR: string = FUND_COLORS[0];

/**
 * Sum of moves leaving a fund (excluding internal balance-sheet flows).
 * fromFund = null means money entered from outside the tracked balance sheet.
 */
export const getFundOutflows = (fundId: string, fundMoves: FundMove[]): number =>
  fundMoves.filter((m) => m.fromFund === fundId).reduce((total, m) => total + m.amount, 0);

/**
 * Sum of moves entering a fund.
 * toFund = null means money left the tracked balance sheet entirely
 * (e.g. an expense consuming the fund) — still counts as an inflow of the
 * receiving side being null, i.e. the move is a draw-down of fromFund.
 */
export const getFundInflows = (fundId: string, fundMoves: FundMove[]): number =>
  fundMoves.filter((m) => m.toFund === fundId).reduce((total, m) => total + m.amount, 0);

export const getFundBalance = (fundId: string, fundMoves: FundMove[]): number =>
  getFundInflows(fundId, fundMoves) - getFundOutflows(fundId, fundMoves);

export const getFundsBalances = (funds: Fund[], fundMoves: FundMove[]) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves),
  }));

export const getTotalFundsBalance = (fundMoves: FundMove[]): number =>
  fundMoves.reduce(
    (total, m) => total + (m.toFund ? m.amount : 0) - (m.fromFund ? m.amount : 0),
    0,
  );

/** Every fund sitting strictly below the given fund in the tree. */
export const getFundDescendants = (fundId: string, funds: Fund[]): Set<string> => {
  const descendants = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const fund of funds) {
      if (fund.parentFund === fundId || (fund.parentFund && descendants.has(fund.parentFund))) {
        if (fund.id !== fundId && !descendants.has(fund.id)) {
          descendants.add(fund.id);
          grew = true;
        }
      }
    }
  }
  return descendants;
};

/**
 * Reparenting a fund under itself or one of its descendants would create a
 * cycle; both are invalid.
 */
export const wouldCreateCycle = (
  fundId: string,
  newParentFund: string | null,
  funds: Fund[],
): boolean => {
  if (!newParentFund) return false;
  return newParentFund === fundId || getFundDescendants(fundId, funds).has(newParentFund);
};

/**
 * A subtree's balance is the money that entered it minus the money that left
 * it. Summing the members' own balances yields exactly that: a move between
 * two funds inside the subtree cancels out, while a move crossing the subtree
 * boundary counts once on the inside side.
 */
export const getFundTreeBalance = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
): number => {
  const ids = new Set([fundId, ...getFundDescendants(fundId, funds)]);
  return fundMoves.reduce(
    (total, m) =>
      total +
      (m.toFund && ids.has(m.toFund) ? m.amount : 0) -
      (m.fromFund && ids.has(m.fromFund) ? m.amount : 0),
    0,
  );
};

/** A fund flattened for a tree view: the fund, its depth, and whether it opens. */
export type FundTreeNode = {
  fund: Fund;
  depth: number;
  hasChildren: boolean;
};

/**
 * Depth-first, name-sorted flattening of the fund forest. Cycles are guarded
 * against defensively: a fund reached through a cycle appears at most once.
 */
export const flattenFundTree = (funds: Fund[]): FundTreeNode[] => {
  const byName = (a: Fund, b: Fund) => a.name.localeCompare(b.name);
  const childrenOf = new Map<string, Fund[]>();
  const roots: Fund[] = [];
  for (const fund of funds) {
    if (fund.parentFund && fund.parentFund !== fund.id) {
      const siblings = childrenOf.get(fund.parentFund) ?? [];
      siblings.push(fund);
      childrenOf.set(fund.parentFund, siblings);
    } else {
      roots.push(fund);
    }
  }
  for (const siblings of childrenOf.values()) siblings.sort(byName);
  roots.sort(byName);

  const nodes: FundTreeNode[] = [];
  const seen = new Set<string>();
  const walk = (fund: Fund, depth: number) => {
    if (seen.has(fund.id)) return;
    seen.add(fund.id);
    const children = childrenOf.get(fund.id) ?? [];
    nodes.push({ fund, depth, hasChildren: children.length > 0 });
    for (const child of children) walk(child, depth + 1);
  };
  for (const root of roots) walk(root, 0);

  // A malformed parent pointer (parent id not among the funds) would strand
  // a fund; append anything left so it stays visible.
  for (const fund of funds) if (!seen.has(fund.id)) walk(fund, 0);

  return nodes;
};

/** The chain from a fund's root parent down to (excluding) the fund itself. */
export const getFundAncestors = (fundId: string, funds: Fund[]): Fund[] => {
  const byId = new Map(funds.map((fund) => [fund.id, fund]));
  const ancestors: Fund[] = [];
  const seen = new Set<string>([fundId]);
  let current = byId.get(fundId)?.parentFund ?? null;
  while (current && !seen.has(current)) {
    const fund = byId.get(current);
    if (!fund) break;
    ancestors.unshift(fund);
    seen.add(current);
    current = fund.parentFund;
  }
  return ancestors;
};
