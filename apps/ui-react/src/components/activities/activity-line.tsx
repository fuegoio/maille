import { type Activity } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
} from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import { ledgerRowClassName } from "@/components/shared/ledger-table";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { ActivityAmountsValue } from "./activity-amounts";

interface ActivityLineProps {
  activity: Activity;
  onCheckedChange: (event?: React.MouseEvent) => void;
  checked?: boolean;
  /** Outline sides when the row is checked or focused; absent otherwise. */
  outlineSides?: { top: boolean; bottom: boolean };
  /** Hide the checkbox in summary contexts; selection stays a table-only concern. */
  showCheckbox?: boolean;
  accountFilter?: string | null;
  hideProject?: boolean;
}

export function ActivityLine({
  activity,
  onCheckedChange,
  checked = false,
  outlineSides,
  showCheckbox = true,
  accountFilter = null,
  hideProject = false,
}: ActivityLineProps) {
  const currencyFormatter = useCurrencyFormatter();
  const showTransactions = useActivities((state) => state.showTransactions);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const getProjectById = useProjects((state) => state.getProjectById);

  const transactions = activity.transactions.filter((t) =>
    accountFilter !== null
      ? t.fromAccount === accountFilter || t.toAccount === accountFilter
      : true,
  );

  const hasTransactions = showTransactions && transactions.length > 0;

  const getStatusIcon = () => {
    if (activity.status === "scheduled") {
      return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />;
    } else if (activity.status === "incomplete") {
      return <CircleDotDashed className="size-4 shrink-0 text-warning" />;
    } else {
      return <CircleCheck className="size-4 shrink-0 text-primary" />;
    }
  };

  const getCategoryName = () => {
    if (activity.category === null) return null;
    const category = categories.find((c) => c.id === activity.category);
    if (!category) return null;

    return (
      <>
        {category.emoji && <span className="sm:mr-0.5">{category.emoji}</span>}
        <span className="hidden sm:inline">{category.name}</span>
      </>
    );
  };

  const getSubcategoryName = () => {
    if (activity.subcategory === null) return null;
    const subcategory = subcategories.find(
      (c) => c.id === activity.subcategory,
    );
    if (!subcategory) return null;
    return (
      <>
        {subcategory.emoji && (
          <span className="sm:mr-0.5">{subcategory.emoji}</span>
        )}
        <span className="hidden sm:inline">{subcategory.name}</span>
      </>
    );
  };

  return (
    <div
      className={cn(
        ledgerRowClassName,
        "group relative block shrink border-b pl-1",
        hasTransactions ? "pb-2" : "h-10",
        outlineSides && rowOutlineClasses(outlineSides),
      )}
    >
      {/* Stretched link: the row itself must not be an anchor, because the
          category/subcategory/project badges below are links too. */}
      <ContextLink
        to="/activities/$id"
        params={{ id: activity.id }}
        aria-label={activity.name}
        className="absolute inset-0 focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
      />
      <div className="flex h-10 items-center gap-2 pr-2 pl-4.5 text-sm lg:pr-6">
        {showCheckbox && (
          <Checkbox
            checked={checked}
            onCheckedChange={(checked) =>
              checked != "indeterminate" && onCheckedChange()
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCheckedChange(e);
            }}
            className={cn(
              "relative z-10 mr-1 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex",
              checked && "opacity-100",
            )}
          />
        )}

        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(activity.date, "dd EEE")}
        </div>
        <div className="ml-1 w-8 shrink-0 text-muted-foreground lg:hidden">
          {format(activity.date, "dd EEEEE")}
        </div>

        {getStatusIcon()}

        <div className="mr-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {activity.name}
        </div>

        <div className="flex-1" />

        <div className="mr-2 flex min-w-0 items-center">
          {activity.category !== null && getCategoryName() && (
            <Badge
              variant="outline"
              asChild
              className="relative z-10 h-6 [a]:hover:bg-border/50"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Link to={`/categories/$id`} params={{ id: activity.category }}>
                {getCategoryName()}
              </Link>
            </Badge>
          )}

          {activity.subcategory !== null && getSubcategoryName() && (
            <>
              <ChevronRight className="mx-1 size-4 text-muted-foreground" />
              <Badge
                variant="outline"
                asChild
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 h-6 [a]:hover:bg-border/50"
              >
                <Link
                  to={`/categories/$id/subcategories/$subcategoryId`}
                  params={{
                    id: activity.category!,
                    subcategoryId: activity.subcategory,
                  }}
                >
                  {getSubcategoryName()}
                </Link>
              </Badge>
            </>
          )}

          {activity.project !== null &&
            !hideProject &&
            getProjectById(activity.project) && (
              <>
                <div className="mx-3 h-4 w-px bg-muted-foreground" />
                <Badge
                  variant="secondary"
                  asChild
                  className="relative z-10 h-6 [a]:hover:bg-border/50"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Link to={`/projects/$id`} params={{ id: activity.project }}>
                    <span>{getProjectById(activity.project)!.emoji}</span>
                    <span className="hidden truncate sm:inline">
                      {getProjectById(activity.project)!.name}
                    </span>
                  </Link>
                </Badge>
              </>
            )}
        </div>

        <ActivityAmountsValue amounts={activity.amounts} className="text-sm" />
      </div>

      {hasTransactions && (
        <ul
          aria-label={`Transactions for ${activity.name}`}
          className={cn(
            "pointer-events-none pr-2 pl-17.5 text-xs text-muted-foreground lg:pr-6",
            showCheckbox ? "sm:pl-24.5 lg:pl-29.5" : "lg:pl-22.5",
          )}
        >
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="relative flex h-8 items-center gap-3 pl-5 before:absolute before:inset-y-0 before:left-0 before:border-l before:border-border/70 after:absolute after:top-[calc(50%-0.375rem)] after:left-0 after:w-3 after:origin-top-left after:rotate-30 after:border-t after:border-border/70 first:before:-top-2 last:before:bottom-[calc(50%+0.375rem)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <AccountLabel accountId={transaction.fromAccount} size="sm" />
                <span className="shrink-0">to</span>
                <AccountLabel accountId={transaction.toAccount} size="sm" />
              </div>
              <div className="shrink-0 text-right font-mono whitespace-nowrap tabular-nums">
                {currencyFormatter.format(transaction.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
