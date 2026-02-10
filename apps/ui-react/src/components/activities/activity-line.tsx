import { ActivityType, type Activity } from "@maille/core/activities";

import { AccountLabel } from "@/components/accounts/account-label";
import { AmountInput } from "@/components/ui/amount-input";
import { getCurrencyFormatter } from "@/lib/utils";
import { updateTransactionMutation } from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";
import { useSync } from "@/stores/sync";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

interface ActivityLineProps {
  activity: Activity;
  onClick?: (activityId: string) => void;
  selected?: boolean;
  accountFilter?: string | null;
  hideProject?: boolean;
}

export function ActivityLine({
  activity,
  onClick,
  selected = false,
  accountFilter = null,
  hideProject = false,
}: ActivityLineProps) {
  const currencyFormatter = getCurrencyFormatter();
  const showTransactions = useActivities(
    (state) => state.showTransactions,
  );
  const categories = useActivities(
    (state) => state.activityCategories,
  );
  const subcategories = useActivities(
    (state) => state.activitySubcategories,
  );
  const getProjectById = useProjects(
    (state) => state.getProjectById,
  );

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
      return <i className="mdi mdi-progress-clock text-primary-100 text-lg" />;
    } else if (activity.status === "incomplete") {
      return <i className="mdi mdi-progress-helper text-lg text-orange-300" />;
    } else {
      return (
        <i className="mdi mdi-check-circle-outline text-lg text-emerald-300" />
      );
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
      className={`group block shrink-0 overflow-hidden border-b transition-colors ${
        selected
          ? "border-l-4 border-l-primary bg-accent"
          : "pl-1 hover:bg-accent"
      }`}
      style={{
        height: showTransactions
          ? `${40 * (1 + transactions.length)}px`
          : "40px",
      }}
      onClick={handleClick}
    >
      <div className="flex h-10 items-center gap-2 pr-2 pl-7 text-sm lg:pr-6">
        <div className="ml-6 hidden w-20 shrink-0 text-muted-foreground lg:block">
          {activity.date.toLocaleDateString()}
        </div>
        <div className="w-10 shrink-0 text-muted-foreground lg:hidden">
          {activity.date.toLocaleDateString(undefined, {
            month: "2-digit",
            day: "2-digit",
          })}
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

          {activity.type && (
            <div
              className="size-2 shrink-0 rounded-xs"
              style={{
                backgroundColor: `var(--${ACTIVITY_TYPES_COLOR[activity.type]}-300)`,
              }}
            />
          )}

          {activity.category !== null && getCategoryName() && (
            <>
              <i className="mdi mdi-chevron-right mx-1" />
              <div className="overflow-hidden text-ellipsis whitespace-nowrap hover:text-accent-foreground">
                {getCategoryName()}
              </div>
            </>
          )}

          {activity.subcategory !== null && getSubcategoryName() && (
            <>
              <i className="mdi mdi-chevron-right mx-1" />
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {getSubcategoryName()}
              </div>
            </>
          )}
        </div>

        <div
          className="text-right font-mono font-medium whitespace-nowrap lg:w-20"
          style={{
            color:
              accountFilter !== null ? "var(--primary-100)" : "var(--white)",
          }}
        >
          {currencyFormatter.format(activity.amount)}
        </div>
      </div>

      {showTransactions && (
        <div className="flex flex-col">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="ml:pl-1 flex h-10 items-center gap-2 border-t pr-4 pl-3 text-sm lg:pr-6"
            >
              <div className="hidden w-4 lg:block" />
              <div className="hidden w-7 shrink-0 lg:block" />
              <div className="shrink-0 lg:w-20" />

              <div className="flex h-10 grow items-center gap-2 border-l-2">
                <AccountLabel accountId={transaction.fromAccount} />
                <div className="text-primary-100 mx-2 text-center">to</div>
                <AccountLabel accountId={transaction.toAccount} />

                <div className="flex-1" />

                <AmountInput
                  value={transaction.amount}
                  onChange={(value) => {
                    const oldTransaction = { ...transaction };
                    const updateTransaction = useActivities((state) => state.updateTransaction);
                    updateTransaction(activity.id, transaction.id, {
                        amount: value,
                      });

                    const mutate = useSync((state) => state.mutate);
                    mutate({
                      name: "updateTransaction",
                      mutation: updateTransactionMutation,
                      variables: {
                        activityId: activity.id,
                        id: transaction.id,
                        amount: value,
                      },
                      rollbackData: oldTransaction,
                    });
                  }}
                  className="h-8 w-20 border-none bg-transparent p-0 text-right text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
