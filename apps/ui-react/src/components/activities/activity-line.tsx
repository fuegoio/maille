import { type Activity } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CircleCheck, CircleDashed, CircleDotDashed } from "lucide-react";

import { AccountLabel } from "@/components/accounts/account-label";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { ACTIVITY_TYPES_COLOR, useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";

interface ActivityLineProps {
  activity: Activity;
  onClick?: (activityId: string) => void;
  onCheckedChange: (checked: boolean) => void;
  selected?: boolean;
  checked?: boolean;
  accountFilter?: string | null;
  hideProject?: boolean;
}

export function ActivityLine({
  activity,
  onClick,
  onCheckedChange,
  selected = false,
  checked = false,
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

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(activity.id);
    }
  };

  const getStatusIcon = () => {
    if (activity.status === "scheduled") {
      return <CircleDashed className="size-4 text-muted-foreground" />;
    } else if (activity.status === "incomplete") {
      return <CircleDotDashed className="size-4 text-orange-300" />;
    } else {
      return <CircleCheck className="size-4 text-indigo-300" />;
    }
  };

  const getCategoryName = () => {
    if (activity.category === null) return null;
    return categories.find((c) => c.id === activity.category)?.name;
  };

  const getSubcategoryName = () => {
    if (activity.subcategory === null) return null;
    return subcategories.find((c) => c.id === activity.subcategory)?.name;
  };

  return (
    <div
      className={cn(
        "group block shrink-0 overflow-hidden border-b transition-colors hover:bg-accent",
        {
          "border-l-4 border-l-primary bg-accent": selected,
          "pl-1": !selected,
          "bg-primary/30 hover:bg-primary/40": checked,
        },
      )}
      style={{
        height: showTransactions
          ? `${40 * (1 + transactions.length)}px`
          : "40px",
      }}
      onClick={handleClick}
    >
      <div className="flex h-10 items-center gap-2 pr-2 pl-4.5 text-sm lg:pr-6">
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) =>
            checked != "indeterminate" && onCheckedChange(checked)
          }
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "mr-3.5 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex",
            checked && "opacity-100",
          )}
        />

        <div
          className={cn(
            "size-2 shrink-0 rounded-lg",
            ACTIVITY_TYPES_COLOR[activity.type],
          )}
        />

        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(activity.date, "dd EEE")}
        </div>
        <div className="w-10 shrink-0 text-muted-foreground lg:hidden">
          {format(activity.date, "dd EEEEE")}
        </div>

        {getStatusIcon()}

        <div className="mr-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {activity.name}
        </div>

        <div className="flex-1" />

        <div className="mr-2 hidden min-w-0 items-center lg:flex">
          {activity.project !== null &&
            !hideProject &&
            getProjectById(activity.project) && (
              <div className="mr-4 flex h-6 min-w-0 items-center rounded-xl border px-2 text-xs tracking-wide transition-colors hover:border-gray-300 hover:bg-accent">
                <span className="mr-2">
                  {getProjectById(activity.project)!.emoji}
                </span>
                <span className="truncate">
                  {getProjectById(activity.project)!.name}
                </span>
              </div>
            )}

          {activity.category !== null && getCategoryName() && (
            <Badge
              variant="outline"
              asChild
              className="h-6"
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
            <Badge
              variant="outline"
              asChild
              onClick={(e) => e.stopPropagation()}
              className="ml-2 h-6"
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
          )}
        </div>

        <div
          className={cn("text-right font-mono font-medium whitespace-nowrap", {
            "text-muted-foreground": accountFilter !== null || showTransactions,
          })}
        >
          {currencyFormatter.format(activity.amount)}
        </div>
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
