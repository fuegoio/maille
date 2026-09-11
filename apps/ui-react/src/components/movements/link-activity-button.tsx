import type { Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";

import { getActivityTransactionsSumByAccount } from "@maille/core/activities";
import _ from "lodash";
import {
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  Euro,
  Landmark,
  Link,
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
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";

import {
  LinkDateFilter,
  matchesDateTolerance,
  TOLERANCE_TEXT,
  type DateTolerance,
} from "./link-date-filter";
import { LinkFilterChip } from "./link-filter-chip";

interface LinkActivityButtonProps {
  movement: Movement;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function LinkActivityButton({
  movement,
  className,
  size = "icon",
}: LinkActivityButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterAmount, setFilterAmount] = React.useState(false);
  const [filterAccount, setFilterAccount] = React.useState(true);
  const [filterUnreconciled, setFilterUnreconciled] = React.useState(true);
  const [dateTolerance, setDateTolerance] =
    React.useState<DateTolerance | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const currencyFormatter = useCurrencyFormatter();

  const { candidates, matchesAmount, involvesAccount, remainingAmount } =
    React.useMemo(() => {
      // Amount still to reconcile on the movement:
      // total minus what linked activities already cover.
      const remainingAmount = _.round(
        movement.amount -
          movement.activities.reduce((sum, ma) => sum + ma.amount, 0),
        2,
      );

      const sumsOf = (activity: Activity) =>
        getActivityTransactionsSumByAccount(activity.transactions, accounts);

      const involvesAccount = (activity: Activity, accountId: string) =>
        sumsOf(activity).some((sba) => sba.account === accountId);

      // An activity matches when one of its account totals corresponds
      // to what the movement still needs.
      const matchesAmount = (activity: Activity) =>
        sumsOf(activity).some(
          (sba) => _.round(sba.total, 2) === remainingAmount,
        );

      const candidates = activities.filter(
        (activity) =>
          !activity.movements.some((am) => am.movement === movement.id),
      );

      return { candidates, matchesAmount, involvesAccount, remainingAmount };
    }, [activities, accounts, movement]);

  // Enable each filter by default only while at least one candidate
  // still matches the filters enabled so far, so the dialog never
  // opens on an empty list. The date filter starts at the tightest
  // tolerance that keeps a match.
  const computeDefaultFilters = () => {
    let pool = candidates;
    let date: DateTolerance | null = null;
    for (const tolerance of [0, 1, 2] as DateTolerance[]) {
      if (
        pool.some((activity) =>
          matchesDateTolerance(activity.date, movement.date, tolerance),
        )
      ) {
        date = tolerance;
        pool = pool.filter((activity) =>
          matchesDateTolerance(activity.date, movement.date, tolerance),
        );
        break;
      }
    }
    const amount = pool.some(matchesAmount);
    if (amount) pool = pool.filter(matchesAmount);
    const account = pool.some((activity) =>
      involvesAccount(activity, movement.account),
    );
    if (account)
      pool = pool.filter((activity) =>
        involvesAccount(activity, movement.account),
      );
    const unreconciled = pool.some(
      (activity) => activity.status !== "completed",
    );
    return { date, amount, account, unreconciled };
  };

  const resetFilters = () => {
    setSearch("");
    const defaults = computeDefaultFilters();
    setDateTolerance(defaults.date);
    setFilterAmount(defaults.amount);
    setFilterAccount(defaults.account);
    setFilterUnreconciled(defaults.unreconciled);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) resetFilters();
  };

  const {
    filteredActivities,
    amountMatchCount,
    reconciledCount,
    dateMatchCount,
  } = React.useMemo(() => {
    const baseActivities = filterAccount
      ? candidates.filter((activity) =>
          involvesAccount(activity, movement.account),
        )
      : candidates;

    const filtered = _.orderBy(
      baseActivities.filter((activity) => {
        if (
          dateTolerance !== null &&
          !matchesDateTolerance(activity.date, movement.date, dateTolerance)
        )
          return false;
        if (filterAmount && !matchesAmount(activity)) return false;
        if (filterUnreconciled && activity.status === "completed") return false;
        if (search !== "" && !searchCompare(search, activity.name))
          return false;
        return true;
      }),
      [matchesAmount, "date"],
      ["desc", "desc"],
    );

    return {
      filteredActivities: filtered,
      dateMatchCount:
        dateTolerance !== null
          ? baseActivities.filter((activity) =>
              matchesDateTolerance(activity.date, movement.date, dateTolerance),
            ).length
          : 0,
      amountMatchCount: baseActivities.filter(matchesAmount).length,
      reconciledCount: baseActivities.filter(
        (activity) => activity.status === "completed",
      ).length,
    };
  }, [
    candidates,
    matchesAmount,
    involvesAccount,
    movement,
    filterAccount,
    filterAmount,
    filterUnreconciled,
    dateTolerance,
    search,
  ]);

  const accountName = accounts.find((a) => a.id === movement.account)?.name;
  const hasActiveFilters =
    filterAmount ||
    !filterAccount ||
    filterUnreconciled ||
    dateTolerance !== null ||
    search !== "";

  const linkActivity = (activity: Activity) => {
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
      items: filteredActivities,
      onSelect: linkActivity,
      resetKey: `${dialogOpen}|${search}|${filterAmount}|${filterAccount}|${filterUnreconciled}|${dateTolerance}`,
    });

  const toggleFilter = (toggle: () => void) => {
    toggle();
    inputRef.current?.focus();
  };

  const renderStatusIcon = (activity: Activity) => {
    if (activity.status === "scheduled") {
      return (
        <CircleDashed className="mx-1.5 size-4 shrink-0 text-muted-foreground" />
      );
    }
    if (activity.status === "incomplete") {
      return (
        <CircleDotDashed className="mx-1.5 size-4 shrink-0 text-orange-300" />
      );
    }
    return <CircleCheck className="mx-1.5 size-4 shrink-0 text-indigo-300" />;
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            className={className}
            onClick={() => handleOpenChange(true)}
          >
            <Link className="h-4 w-4" />
            {size !== "icon" && "Link activity"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Link an activity</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[480px] flex-col sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex h-6 items-center rounded bg-muted px-2.5 text-xs font-medium text-foreground">
                {movement.name}
              </div>
              <div className="flex h-6 items-center rounded bg-muted px-2.5 font-mono text-xs font-medium text-muted-foreground">
                {currencyFormatter.format(remainingAmount)} to reconcile
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for an activity..."
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
                        ? `Amount filter on — ${amountMatchCount} activit${amountMatchCount === 1 ? "y" : "ies"} match${amountMatchCount === 1 ? "es" : ""} the ${currencyFormatter.format(remainingAmount)} to reconcile.`
                        : `Amount filter on — no activity matches the ${currencyFormatter.format(remainingAmount)} to reconcile.`
                      : `Show only activities matching the ${currencyFormatter.format(remainingAmount)} to reconcile.`}
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
                      ? `Only activities with a transaction on ${accountName} are shown. Click to see all activities.`
                      : `Activities from all accounts are shown. Click to restrict to ${accountName}.`}
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
                      ? `Reconciled activities are hidden${reconciledCount > 0 ? ` (${reconciledCount})` : ""}. Click to show all.`
                      : "Show only activities not yet reconciled."}
                  </p>
                }
              >
                To reconcile
              </LinkFilterChip>

              <LinkDateFilter
                tolerance={dateTolerance}
                onChange={(value) =>
                  toggleFilter(() => setDateTolerance(value))
                }
                tooltip={
                  <p>
                    {dateTolerance !== null
                      ? dateMatchCount > 0
                        ? `Date filter on — ${dateMatchCount} activit${dateMatchCount === 1 ? "y" : "ies"} dated ${TOLERANCE_TEXT[dateTolerance]} the movement (${movement.date.toLocaleDateString("fr-FR")}).`
                        : `Date filter on — no activity dated ${TOLERANCE_TEXT[dateTolerance]} the movement (${movement.date.toLocaleDateString("fr-FR")}).`
                      : "Show only activities dated the same day as the movement, or at most 1 or 2 days from it."}
                  </p>
                }
              />
            </div>
          </DialogHeader>

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="flex-1 overflow-auto"
          >
            {filteredActivities.map((activity, index) => {
              const sums = getActivityTransactionsSumByAccount(
                activity.transactions,
                accounts,
              );
              const amountMatches = sums.some(
                (sba) => _.round(sba.total, 2) === remainingAmount,
              );
              const displayedAccount = sums.some(
                (sba) => sba.account === movement.account,
              )
                ? movement.account
                : ((amountMatches
                    ? sums.find(
                        (sba) => _.round(sba.total, 2) === remainingAmount,
                      )?.account
                    : _.maxBy(sums, (sba) => Math.abs(sba.total))?.account) ??
                  movement.account);
              const displayedSum =
                sums.find((sba) => sba.account === displayedAccount)?.total ??
                0;
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={activity.id}
                  data-index={index}
                  role="option"
                  aria-selected={isHighlighted}
                  id={`${listboxId}-option-${index}`}
                  className={cn(
                    "flex h-10 shrink-0 cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-muted",
                    isHighlighted && "bg-accent",
                  )}
                  onClick={() => linkActivity(activity)}
                >
                  <div className="hidden w-20 shrink-0 font-mono text-muted-foreground sm:block">
                    {activity.date.toLocaleDateString("fr-FR")}
                  </div>
                  <div className="w-10 shrink-0 font-mono text-muted-foreground sm:hidden">
                    {activity.date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>

                  {renderStatusIcon(activity)}

                  <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
                    {activity.name}
                  </div>
                  {displayedAccount !== movement.account && (
                    <AccountLabel accountId={displayedAccount} />
                  )}
                  {amountMatches && (
                    <div className="mr-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <div
                    className={cn(
                      "w-24 shrink-0 text-right font-mono whitespace-nowrap",
                      amountMatches ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {currencyFormatter.format(displayedSum)}
                  </div>
                </div>
              );
            })}

            {filteredActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
                <p>
                  {hasActiveFilters
                    ? "No activities match the current filters."
                    : "No activities found."}
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
