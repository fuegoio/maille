import { format } from "date-fns";
import { PiggyBank, TrashIcon } from "lucide-react";
import { useMemo } from "react";

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
import { getFundsBalances } from "@/logic/funds";
import { deleteFundMutation } from "@/mutations/funds";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

import { AllocateDialog } from "./allocate-dialog";
import { CreateFundDialog } from "./create-fund-dialog";

export function FundsTable() {
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const mutate = useSync((state) => state.mutate);
  const currencyFormatter = useCurrencyFormatter();

  const sortedFunds = useMemo(() => {
    return [...funds].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [funds]);

  const balances = useMemo(
    () => getFundsBalances(sortedFunds, fundMoves),
    [sortedFunds, fundMoves],
  );

  const handleDelete = (fundId: string) => {
    const fund = funds.find((f) => f.id === fundId);
    if (!fund || fund.isDefault) return;

    mutate({
      name: "deleteFund",
      mutation: deleteFundMutation,
      variables: { id: fundId },
      rollbackData: fund,
      events: [
        {
          type: "deleteFund",
          payload: { id: fundId },
        },
      ],
    });
  };

  if (funds.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiggyBank />
            </EmptyMedia>
            <EmptyTitle>No funds</EmptyTitle>
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
      {balances.map(({ fund, balance }) => (
        <div
          key={fund.id}
          className="group flex h-12 w-full items-center border-b pr-6 pl-6 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            {fund.emoji && <span className="text-xl">{fund.emoji}</span>}
            <div className="text-sm font-medium">{fund.name}</div>
            {fund.isDefault && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Default
              </span>
            )}
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

          <div className="mr-4 font-mono text-sm whitespace-nowrap">
            {currencyFormatter.format(balance)}
          </div>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <AllocateDialog defaultToFund={fund.id}>
              <Button variant="ghost" size="icon-xs">
                <PiggyBank />
              </Button>
            </AllocateDialog>
            {!fund.isDefault && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(fund.id)}
              >
                <TrashIcon />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
