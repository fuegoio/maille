import { flattenFundTree } from "@maille/core/funds";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowDownToLine,
  ChevronRight,
  PiggyBank,
  Plus,
  SettingsIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getFundTreeBalance, getUntrackedBalanceAtDate } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

import { AllocateDialog } from "./allocate-dialog";
import { CreateFundDialog } from "./create-fund-dialog";
import { FundSettingsDialog } from "./fund-settings-dialog";

/** Collapsed parent ids, kept across sessions. */
const COLLAPSED_KEY = "maille:funds-tree-collapsed";

const readCollapsed = (): Set<string> => {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

export function FundsTable() {
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);
  const currencyFormatter = useCurrencyFormatter();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed);

  const toggleCollapsed = (fundId: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(fundId)) {
        next.delete(fundId);
      } else {
        next.add(fundId);
      }
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // Collapsed state is a nicety; losing it is harmless.
      }
      return next;
    });
  };

  const nodes = useMemo(() => flattenFundTree(funds), [funds]);

  // A node is hidden while any of its ancestors is collapsed.
  const visibleNodes = useMemo(() => {
    const byId = new Map(funds.map((fund) => [fund.id, fund]));
    return nodes.filter(({ fund }) => {
      let parent = byId.get(fund.id)?.parentFund ?? null;
      while (parent) {
        if (collapsed.has(parent)) return false;
        parent = byId.get(parent)?.parentFund ?? null;
      }
      return true;
    });
  }, [nodes, funds, collapsed]);

  // Every row shows its subtree rollup: money in the fund plus everything
  // nested under it. For a leaf this is its own balance.
  const balances = useMemo(
    () =>
      new Map(
        funds.map((fund) => [
          fund.id,
          getFundTreeBalance(fund.id, funds, fundMoves),
        ]),
      ),
    [funds, fundMoves],
  );

  const untrackedBalance = useMemo(
    () =>
      user
        ? getUntrackedBalanceAtDate({
            accounts,
            activities,
            fundMoves,
            date: new Date(),
            startingDate: user.startingDate,
          })
        : 0,
    [accounts, activities, fundMoves, user],
  );

  if (funds.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiggyBank />
            </EmptyMedia>
            <EmptyTitle>No Funds Yet</EmptyTitle>
            <EmptyDescription>
              Funds let you label what your money is for, while accounts track
              where it is.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateFundDialog>
              <Button>Create a fund</Button>
            </CreateFundDialog>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {visibleNodes.map(({ fund, depth, hasChildren }) => {
        const isCollapsed = collapsed.has(fund.id);
        return (
          <div
            key={fund.id}
            className="group flex h-12 w-full cursor-pointer items-center border-b pr-6 pl-6 hover:bg-muted/50"
            onClick={(e) => {
              // Dialogs render in portals; their clicks still bubble through
              // the React tree back into this row. Only navigate for clicks
              // that land inside the row's own DOM.
              if (!e.currentTarget.contains(e.target as Node)) return;
              navigate({ to: "/funds/$id", params: { id: fund.id } });
            }}
          >
            <div
              className="flex min-w-0 items-center"
              style={depth > 0 ? { paddingLeft: `${depth * 20}px` } : undefined}
            >
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={
                    isCollapsed
                      ? `Expand ${fund.name}`
                      : `Collapse ${fund.name}`
                  }
                  aria-expanded={!isCollapsed}
                  className="mr-0.5 size-5 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapsed(fund.id);
                  }}
                >
                  <ChevronRight
                    className={
                      isCollapsed
                        ? "transition-transform motion-reduce:transition-none"
                        : "rotate-90 transition-transform motion-reduce:transition-none"
                    }
                  />
                </Button>
              ) : (
                <div className="mr-0.5 size-5 shrink-0" aria-hidden="true" />
              )}
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
              <div className="ml-2 truncate text-sm font-medium">
                {fund.name}
              </div>
            </div>

            {(fund.startDate || fund.endDate) && (
              <div className="ml-4 text-sm text-muted-foreground">
                {fund.startDate && (
                  <span>{format(new Date(fund.startDate), "dd/MM/yyyy")}</span>
                )}
                {fund.startDate && fund.endDate && <span> → </span>}
                {fund.endDate && (
                  <span>{format(new Date(fund.endDate), "dd/MM/yyyy")}</span>
                )}
              </div>
            )}

            <div className="flex-1" />

            <div className="mr-4 flex w-32 items-center justify-end font-mono text-sm whitespace-nowrap">
              {currencyFormatter.format(balances.get(fund.id) ?? 0)}
            </div>

            <div className="flex w-20 shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <AllocateDialog defaultToFund={fund.id}>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Allocate to ${fund.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowDownToLine />
                </Button>
              </AllocateDialog>
              <CreateFundDialog defaultParent={fund.id}>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`New subfund under ${fund.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus />
                </Button>
              </CreateFundDialog>
              <FundSettingsDialog fund={fund}>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${fund.name} settings`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SettingsIcon />
                </Button>
              </FundSettingsDialog>
            </div>
          </div>
        );
      })}

      {/* Untracked is the complement of every fund: muted, at the bottom. */}
      <div
        className="flex h-12 w-full cursor-pointer items-center border-b pr-6 pl-6 hover:bg-muted/50"
        onClick={() => navigate({ to: "/funds/untracked" })}
      >
        <div className="flex items-center text-muted-foreground">
          <div className="mr-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
          <div className="ml-2 text-sm font-medium">Untracked</div>
        </div>

        <div className="flex-1" />

        <div className="mr-4 flex w-32 items-center justify-end font-mono text-sm whitespace-nowrap text-muted-foreground">
          {currencyFormatter.format(untrackedBalance)}
        </div>

        <div className="w-20 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
