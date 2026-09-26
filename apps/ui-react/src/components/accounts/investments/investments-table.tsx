import {
  investmentValueAt,
  latestInvestmentPrice,
} from "@maille/core/accounts";
import { ChartLine, Plus } from "lucide-react";
import { useMemo } from "react";

import { AddInvestmentModal } from "@/components/accounts/investments/add-investment-modal";
import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { cn } from "@/lib/utils";
import { endOfToday } from "@/logic/investments";
import { useInvestments } from "@/stores/investments";

import { Button } from "../../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../ui/empty";

interface InvestmentsTableProps {
  accountId: string;
}

export function InvestmentsTable({ accountId }: InvestmentsTableProps) {
  const contextNavigate = useContextNavigate();
  const investments = useInvestments((state) => state.investments);
  const prices = useInvestments((state) => state.investmentPrices);
  const currencyFormatter = useCurrencyFormatter();

  const accountInvestments = useMemo(
    () => investments.filter((investment) => investment.account === accountId),
    [investments, accountId],
  );

  // Largest value first; positions without a price keep store order
  // after the priced ones.
  const sortedInvestments = useMemo(() => {
    const now = new Date(endOfToday());
    return [...accountInvestments].sort((a, b) => {
      const aValue = investmentValueAt(a, prices, now);
      const bValue = investmentValueAt(b, prices, now);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return bValue - aValue;
    });
  }, [accountInvestments, prices]);

  const rows = useMemo<TableRow[]>(
    () => accountInvestments.map((investment) => ({ id: investment.id })),
    [accountInvestments],
  );

  const { rowOutlines, registerRow } = useTableRows({
    rows,
    onOpen: (id) => {
      void contextNavigate({ to: "/investments/$id", params: { id } });
    },
  });

  const openInvestment = (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const id = (event.currentTarget as HTMLElement).dataset.investmentId;
    if (!id) return;
    void contextNavigate({ to: "/investments/$id", params: { id } });
  };

  const now = new Date(endOfToday());
  const pricedTotal = accountInvestments.reduce(
    (total, investment) =>
      total + (investmentValueAt(investment, prices, now) ?? 0),
    0,
  );
  const unpriced =
    accountInvestments.length -
    accountInvestments.filter(
      (investment) =>
        latestInvestmentPrice(prices, investment.id, now) !== null,
    ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {accountInvestments.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia>
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <ChartLine className="size-6 text-muted-foreground" />
              </div>
            </EmptyMedia>
            <EmptyTitle>No investments yet</EmptyTitle>
            <EmptyDescription>
              This account doesn't hold any tracked position. Add your first
              investment to follow its value over time.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddInvestmentModal accountId={accountId}>
              <Button>
                <Plus />
                Add investment
              </Button>
            </AddInvestmentModal>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <header className="flex h-8 items-center border-b bg-muted/50 pr-6 pl-14 text-xs font-medium text-muted-foreground">
            <div className="flex-1">Investment</div>
            <div className="hidden w-28 text-right sm:block">Quantity</div>
            <div className="hidden w-32 text-right sm:block">Last price</div>
            <div className="w-32 text-right">Value</div>
          </header>

          {sortedInvestments.map((investment) => {
            const lastPrice = latestInvestmentPrice(prices, investment.id, now);
            const value = investmentValueAt(investment, prices, now);

            return (
              <div
                key={investment.id}
                ref={registerRow(investment.id)}
                data-investment-id={investment.id}
                className={cn(
                  "group flex h-10 w-full cursor-pointer items-center border-b pr-6 pl-14 transition-colors hover:bg-muted/50",
                  rowOutlines.has(investment.id) &&
                    rowOutlineClasses(rowOutlines.get(investment.id)!),
                )}
                onClick={openInvestment}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold">
                    {investment.name}
                  </span>
                  {investment.symbol && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {investment.symbol}
                    </span>
                  )}
                </div>

                <div className="hidden w-28 text-right font-mono text-sm text-muted-foreground sm:block">
                  {investment.quantity}
                </div>

                <div
                  className="hidden w-32 text-right font-mono text-sm sm:block"
                  title={lastPrice ? "Unit price" : "No price yet"}
                >
                  {lastPrice ? (
                    currencyFormatter.format(lastPrice.price)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="w-32 text-right font-mono text-sm">
                  {value !== null ? (
                    currencyFormatter.format(value)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex h-10 items-center border-b bg-muted/30 pr-6 pl-14 text-xs font-medium text-muted-foreground">
            <div className="flex-1">
              Total
              {unpriced > 0 && (
                <span className="ml-2 font-normal">
                  {unpriced} without price
                </span>
              )}
            </div>
            <div className="hidden w-28 sm:block" />
            <div className="hidden w-32 sm:block" />
            <div className="w-32 text-right font-mono font-medium text-foreground">
              {currencyFormatter.format(pricedTotal)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
