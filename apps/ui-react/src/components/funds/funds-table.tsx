import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowDownToLine, PiggyBank, SettingsIcon } from "lucide-react";
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
import { useFunds } from "@/stores/funds";

import { AllocateDialog } from "./allocate-dialog";
import { CreateFundDialog } from "./create-fund-dialog";
import { FundSettingsDialog } from "./fund-settings-dialog";

export function FundsTable() {
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const currencyFormatter = useCurrencyFormatter();
  const navigate = useNavigate();

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
      {balances.map(({ fund, balance }) => (
        <div
          key={fund.id}
          className="group flex h-12 w-full cursor-pointer items-center border-b pr-6 pl-6 hover:bg-muted/50"
          onClick={() =>
            navigate({ to: "/funds/$id", params: { id: fund.id } })
          }
        >
          <div className="flex items-center gap-2">
            <div
              className="size-3 shrink-0 rounded-xl"
              style={{ backgroundColor: fund.color }}
            />
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

          <div className="mr-4 flex w-32 items-center justify-end font-mono text-sm whitespace-nowrap">
            {currencyFormatter.format(balance)}
          </div>

          <div className="flex w-14 shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
            {!fund.isDefault && (
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
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
