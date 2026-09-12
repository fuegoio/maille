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
  accountFilter?: string | null;
  hideProject?: boolean;
}

export function ActivityLine({
  activity,
  onCheckedChange,
  checked = false,
  outlineSides,
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

  const getStatusIcon = () => {
    if (activity.status === "scheduled") {
      return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />;
    } else if (activity.status === "incomplete") {
      return <CircleDotDashed className="size-4 shrink-0 text-orange-300" />;
    } else {
      return <CircleCheck className="size-4 shrink-0 text-indigo-300" />;
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
        "group relative block shrink border-b pl-1 transition-colors hover:bg-accent",
        outlineSides && rowOutlineClasses(outlineSides),
      )}
      style={{
        height: showTransactions
          ? `${40 * (1 + transactions.length)}px`
          : "40px",
      }}
    >
      {/* Stretched link: the row itself must not be an anchor, because the
          category/subcategory/project badges below are links too. */}
      <ContextLink
        to="/activities/$id"
        params={{ id: activity.id }}
        aria-label={activity.name}
        className="absolute inset-0"
      />
      <div className="flex h-10 items-center gap-2 pr-2 pl-4.5 text-sm lg:pr-6">
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

        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(activity.date, "dd MMM")}
        </div>
        <div className="ml-1 w-8 shrink-0 text-muted-foreground lg:hidden">
          {format(activity.date, "dd MMM")}
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

      {showTransactions && (
        <div className="flex flex-col">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex h-10 items-center gap-2 border-t pr-6 pl-41.75 text-sm"
            >
              <div className="flex h-10 grow items-center gap-2 border-l-2 pl-4">
                <AccountLabel accountId={transaction.fromAccount} />
                <div className="text-primary-100 mx-2 text-center">to</div>
                <AccountLabel accountId={transaction.toAccount} />

                <div className="flex-1" />
                <div className="text-right font-mono font-medium whitespace-nowrap">
                  {currencyFormatter.format(transaction.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
