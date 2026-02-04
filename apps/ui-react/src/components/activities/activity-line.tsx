import { ActivityType, type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { useStore } from "zustand";
import { activitiesStore } from "@/stores/activities";
import { projectsStore } from "@/stores/projects";
import { eventsStore } from "@/stores/events";
import { updateTransactionMutation } from "@/mutations/activities";
import { AccountLabel } from "@/components/accounts/account-label";
import { AmountInput } from "@/components/ui/amount-input";
import type { UUID } from "crypto";

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
  accountFilter?: UUID | null;
  hideProject?: boolean;
}

export function ActivityLine({ 
  activity, 
  onClick, 
  selected = false, 
  accountFilter = null, 
  hideProject = false 
}: ActivityLineProps) {
  const currencyFormatter = getCurrencyFormatter();
  const showTransactions = useStore(activitiesStore, (state) => state.showTransactions);
  const categories = useStore(activitiesStore, (state) => state.activityCategories);
  const subcategories = useStore(activitiesStore, (state) => state.activitySubcategories);
  const getProjectById = useStore(projectsStore, (state) => state.getProjectById);

  const transactions = activity.transactions.filter((t) => 
    accountFilter !== null 
      ? t.fromAccount === accountFilter || t.toAccount === accountFilter
      : true
  );

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(activity.id);
    }
  };

  const getStatusIcon = () => {
    if (activity.status === "scheduled") {
      return <i className="mdi mdi-progress-clock text-lg text-primary-100" />;
    } else if (activity.status === "incomplete") {
      return <i className="mdi mdi-progress-helper text-lg text-orange-300" />;
    } else {
      return <i className="mdi mdi-check-circle-outline text-lg text-emerald-300" />;
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
      className={`block overflow-hidden border-b flex-shrink-0 group transition-colors ${
        selected ? "bg-primary-800/50 border-l-4 border-l-accent" : "hover:bg-primary-800/50 pl-1"
      }`}
      style={{ 
        height: showTransactions ? `${40 * (1 + transactions.length)}px` : "40px"
      }}
      onClick={handleClick}
    >
      <div className="h-10 flex items-center gap-2 pl-3 pr-2 lg:pr-6 lg:pl-1 text-sm">
        <div className="hidden lg:block text-primary-100 w-20 shrink-0 ml-4">
          {activity.date.toLocaleDateString()}
        </div>
        <div className="lg:hidden text-primary-100 w-10 shrink-0">
          {activity.date.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" })}
        </div>

        {getStatusIcon()}

        <div className="mr-1 text-white font-medium text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
          {activity.name}
        </div>

        <div className="flex-1" />

        <div className="items-center mr-2 min-w-0 hidden lg:flex">
          {activity.project !== null && !hideProject && getProjectById(activity.project) && (
            <div className="border rounded-xl h-6 flex items-center px-2 mr-4 text-white text-xs tracking-wide hover:bg-primary-900 hover:border-gray-300 transition-colors min-w-0">
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
              className="size-2 rounded-xs shrink-0"
              style={{ backgroundColor: `var(--${ACTIVITY_TYPES_COLOR[activity.type]}-300)` }}
            />
          )}

          {activity.category !== null && getCategoryName() && (
            <>
              <i className="mdi mdi-chevron-right text-primary-100 mx-1" />
              <div className="text-white text-ellipsis overflow-hidden whitespace-nowrap hover:text-primary-200">
                {getCategoryName()}
              </div>
            </>
          )}

          {activity.subcategory !== null && getSubcategoryName() && (
            <>
              <i className="mdi mdi-chevron-right text-primary-100 mx-1" />
              <div className="text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap">
                {getSubcategoryName()}
              </div>
            </>
          )}
        </div>

        <div 
          className="lg:w-20 text-right whitespace-nowrap font-mono font-medium"
          style={{ color: accountFilter !== null ? "var(--primary-100)" : "var(--white)" }}
        >
          {currencyFormatter.format(activity.amount)}
        </div>
      </div>

      {showTransactions && (
        <div className="flex flex-col">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="h-10 flex items-center gap-2 text-sm border-t pl-3 pr-4 lg:pr-6 ml:pl-1"
            >
              <div className="w-4 hidden lg:block" />
              <div className="w-7 hidden lg:block shrink-0" />
              <div className="lg:w-20 shrink-0" />

              <div className="flex items-center border-l-2 gap-2 h-10 flex-grow">
                <AccountLabel accountId={transaction.fromAccount} />
                <div className="mx-2 text-center text-primary-100">to</div>
                <AccountLabel accountId={transaction.toAccount} />

                <div className="flex-1" />

                <AmountInput
                  value={transaction.amount}
                  onChange={(value) => {
                    const oldTransaction = { ...transaction };
                    activitiesStore.getState().updateTransaction(
                      activity.id,
                      transaction.id,
                      { amount: value }
                    );

                    eventsStore.getState().sendEvent({
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
                  className="text-xs w-20 h-8 border-none bg-transparent p-0 text-right"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

