import type { Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";

import { getActivityMovementsReconciliatedByAccount } from "@maille/core/activities";
import _ from "lodash";
import {
  CircleCheck,
  CircleDotDashed,
  Euro,
  Landmark,
  Plus,
} from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useListKeyboardNavigation } from "@/hooks/use-list-keyboard-navigation";
import {
  linkActivityHistoryEvent,
  linkMovementHistoryEvent,
} from "@/lib/history-events";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { createMovementActivityMutation } from "@/mutations/movements";
import { useAccounts } from "@/stores/accounts";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { LinkFilterChip } from "./link-filter-chip";

interface LinkMovementButtonProps {
  activity: Activity;
  account: string;
  className?: string;
}

export function LinkMovementButton({
  activity,
  account,
  className,
}: LinkMovementButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterAmount, setFilterAmount] = React.useState(true);
  const [filterAccount, setFilterAccount] = React.useState(true);
  const [filterUnreconciled, setFilterUnreconciled] = React.useState(true);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  const resetFilters = () => {
    setSearch("");
    setFilterAmount(true);
    setFilterAccount(true);
    setFilterUnreconciled(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) resetFilters();
  };

  const mutate = useSync((state) => state.mutate);
  const movements = useMovements((state) => state.movements);
  const accounts = useAccounts((state) => state.accounts);
  const currencyFormatter = useCurrencyFormatter();

  const {
    neededByAccount,
    filteredMovements,
    amountMatchCount,
    reconciledCount,
  } = React.useMemo(() => {
    // Amount still needed on each of the activity's accounts:
    // transaction total minus what linked movements already cover.
    const reconciliatedByAccount = getActivityMovementsReconciliatedByAccount(
      activity.transactions,
      activity.movements,
      accounts,
      (movementId) => movements.find((m) => m.id === movementId),
    );
    const neededByAccount = new Map(
      reconciliatedByAccount.map((rba) => [
        rba.account,
        _.round(rba.transactionTotal - rba.movementTotal, 2),
      ]),
    );

    const matchesAmount = (movement: Movement) =>
      neededByAccount.get(movement.account) !== undefined &&
      _.round(movement.amount, 2) === neededByAccount.get(movement.account);

    const baseMovements = movements.filter((movement) => {
      if (movement.activities.some((ma) => ma.activity === activity.id))
        return false;
      if (filterAccount && movement.account !== account) return false;
      return true;
    });

    const filtered = _.orderBy(
      baseMovements.filter((movement) => {
        if (filterAmount && !matchesAmount(movement)) return false;
        if (filterUnreconciled && movement.status === "completed") return false;
        if (search !== "" && !searchCompare(search, movement.name))
          return false;
        return true;
      }),
      [(movement) => matchesAmount(movement), "date"],
      ["desc", "desc"],
    );

    return {
      filteredMovements: filtered,
      neededByAccount,
      amountMatchCount: baseMovements.filter(matchesAmount).length,
      reconciledCount: baseMovements.filter(
        (movement) => movement.status === "completed",
      ).length,
    };
  }, [
    movements,
    accounts,
    activity,
    account,
    filterAccount,
    filterAmount,
    filterUnreconciled,
    search,
  ]);

  const neededAmount = neededByAccount.get(account) ?? 0;
  const accountName = accounts.find((a) => a.id === account)?.name;
  const hasActiveFilters =
    filterAmount || !filterAccount || filterUnreconciled || search !== "";

  const linkMovement = async (movement: Movement) => {
    const newId = crypto.randomUUID();
    const historyEvents = [
      linkMovementHistoryEvent(movement, activity, movement.amount),
      linkActivityHistoryEvent(activity, movement, movement.amount),
    ];
    mutate({
      name: "createMovementActivity",
      mutation: createMovementActivityMutation,
      variables: {
        id: newId,
        movementId: movement.id,
        activityId: activity.id,
        amount: movement.amount,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createMovementActivity",
          payload: {
            id: newId,
            movement: movement.id,
            activity: activity.id,
            amount: movement.amount,
          },
        },
        ...historyEvents,
      ],
    });

    setDialogOpen(false);
  };

  const { highlightedIndex, listRef, handleKeyDown } =
    useListKeyboardNavigation({
      items: filteredMovements,
      onSelect: linkMovement,
      resetKey: `${dialogOpen}|${search}|${filterAmount}|${filterAccount}|${filterUnreconciled}`,
    });

  const toggleFilter = (toggle: () => void) => {
    toggle();
    inputRef.current?.focus();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={className}
            onClick={() => handleOpenChange(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Link a movement</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[480px] flex-col sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex h-6 items-center rounded bg-muted px-2.5 text-xs font-medium text-foreground">
                {activity.name}
              </div>
              <div className="flex h-6 items-center rounded bg-muted px-2.5 font-mono text-xs font-medium text-muted-foreground">
                {currencyFormatter.format(neededAmount)} needed
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a movement ..."
              className="h-10 min-w-0 flex-1 border-none bg-transparent pl-1 text-left text-lg text-foreground outline-none"
              ref={inputRef}
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `${listboxId}-option-${highlightedIndex}`
                  : undefined
              }
              autoFocus
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <LinkFilterChip
                active={filterAmount}
                onToggle={() =>
                  toggleFilter(() => setFilterAmount(!filterAmount))
                }
                icon={<Euro className="size-3.5" />}
                tooltip={
                  <p>
                    {filterAmount
                      ? amountMatchCount > 0
                        ? `Amount filter on — ${amountMatchCount} movement${amountMatchCount === 1 ? "" : "s"} match${amountMatchCount === 1 ? "es" : ""} the needed amount.`
                        : `Amount filter on — no movement matches the ${currencyFormatter.format(neededAmount)} needed.`
                      : `Show only movements matching the amount needed on their account.`}
                  </p>
                }
              >
                Amount
              </LinkFilterChip>

              <LinkFilterChip
                active={filterAccount}
                onToggle={() =>
                  toggleFilter(() => setFilterAccount(!filterAccount))
                }
                icon={<Landmark className="size-3.5" />}
                tooltip={
                  <p>
                    {filterAccount
                      ? `Only movements of ${accountName} are shown. Click to see all accounts.`
                      : `Movements of all accounts are shown. Click to restrict to ${accountName}.`}
                  </p>
                }
              >
                {filterAccount
                  ? (accountName ?? "This account")
                  : "All accounts"}
              </LinkFilterChip>

              <LinkFilterChip
                active={filterUnreconciled}
                onToggle={() =>
                  toggleFilter(() => setFilterUnreconciled(!filterUnreconciled))
                }
                icon={<CircleDotDashed className="size-3.5" />}
                tooltip={
                  <p>
                    {filterUnreconciled
                      ? `Reconciled movements are hidden${reconciledCount > 0 ? ` (${reconciledCount})` : ""}. Click to show all.`
                      : "Show only movements not yet reconciled."}
                  </p>
                }
              >
                To reconcile
              </LinkFilterChip>
            </div>
          </DialogHeader>

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="flex-1 overflow-auto"
          >
            {filteredMovements.map((movement, index) => {
              const amountMatches =
                neededByAccount.get(movement.account) !== undefined &&
                _.round(movement.amount, 2) ===
                  neededByAccount.get(movement.account);
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={movement.id}
                  data-index={index}
                  role="option"
                  aria-selected={isHighlighted}
                  id={`${listboxId}-option-${index}`}
                  className={cn(
                    "flex h-10 shrink-0 cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-muted",
                    isHighlighted && "bg-accent",
                  )}
                  onClick={() => linkMovement(movement)}
                >
                  <div className="hidden w-20 shrink-0 font-mono text-muted-foreground sm:block">
                    {movement.date.toLocaleDateString("fr-FR")}
                  </div>
                  <div className="w-10 shrink-0 font-mono text-muted-foreground sm:hidden">
                    {movement.date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>

                  {movement.status === "completed" ? (
                    <CircleCheck className="mx-1.5 size-4 shrink-0 text-indigo-300" />
                  ) : (
                    <CircleDotDashed className="mx-1.5 size-4 shrink-0 text-orange-300" />
                  )}

                  {!filterAccount && (
                    <div className="mr-1">
                      <AccountLabel accountId={movement.account} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
                    {movement.name}
                  </div>
                  {amountMatches && (
                    <div className="mr-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <div
                    className={cn(
                      "w-24 shrink-0 text-right font-mono whitespace-nowrap",
                      amountMatches ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {currencyFormatter.format(movement.amount)}
                  </div>
                </div>
              );
            })}

            {filteredMovements.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
                <p>
                  {hasActiveFilters
                    ? "No movements match the current filters."
                    : "No movements found."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
