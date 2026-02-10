import type { UUID } from "crypto";

import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import dayjs from "dayjs";
import { create } from "zustand";

import type {
  Period,
  PeriodAccountData,
  PeriodActivityData,
} from "@/types/periods";

import { useAccounts } from "./accounts";
import { useActivities } from "./activities";
import { useMovements } from "./movements";
import { useWorkspaces } from "./workspaces";

const NUMBER_OF_PERIODS_AVANCE = 12;

interface ViewFilters {
  category: UUID | null;
  subcategory: UUID | null;
  activityType: ActivityType | null;
  account: UUID | null;
}

interface PeriodsState {
  viewFilters: ViewFilters;

  getPeriodLabel: (period: Period) => "Completed" | "Current" | "Future";
  getPeriodsAvailable: () => Period[];
  getPeriodsActivityData: () => PeriodActivityData[];
  getPeriodsForecastData: () => PeriodActivityData[];
  getPeriodsAccountData: () => PeriodAccountData[];

  setViewFilters: (filters: Partial<ViewFilters>) => void;
}

export const usePeriods = create<PeriodsState>()((set, get) => ({
  viewFilters: {
    category: null,
    subcategory: null,
    activityType: null,
    account: null,
  },

  getPeriodLabel: (period: Period): "Completed" | "Current" | "Future" => {
    const now = dayjs();

    if (now.month(period.month).year(period.year) < now) {
      return "Completed";
    } else if (period.year === now.year() && period.month === now.month()) {
      return "Current";
    } else {
      return "Future";
    }
  },

  getPeriodsAvailable: (): Period[] => {
    const workspace = useWorkspaces.getState().currentWorkspace;
    if (!workspace) return [];

    const now = dayjs();
    const numberOfPeriods =
      now.diff(dayjs(workspace.startingDate), "month") +
      NUMBER_OF_PERIODS_AVANCE;
    const periods: Period[] = [];

    for (let month = 0; month < numberOfPeriods; month++) {
      const date = dayjs(workspace.startingDate).add(month, "month");
      periods.push({
        month: date.month(),
        year: date.year(),
      });
    }

    return periods;
  },

  getPeriodsActivityData: (): PeriodActivityData[] => {
    const { accounts } = useAccounts.getState();
    const { activities, activityCategories: categories } =
      useActivities.getState();
    const periodsAvailable = get().getPeriodsAvailable();

    const periodsActivityData: PeriodActivityData[] = [];
    periodsAvailable.forEach((period) => {
      periodsActivityData.push({
        ...period,
        expense: 0,
        revenue: 0,
        investment: 0,
        balance: 0,
        categories: categories.map((c) => ({ category: c.id, value: 0 })),
      });
    });

    // Processing of activities
    activities.forEach((activity) => {
      const period = periodsActivityData.find(
        (p) =>
          p.month === activity.date.getMonth() &&
          p.year === activity.date.getFullYear(),
      );
      if (!period) return;

      if (activity.type === ActivityType.EXPENSE) {
        period.expense += activity.amount;
      } else if (activity.type === ActivityType.REVENUE) {
        period.revenue += activity.amount;
      } else if (activity.type === ActivityType.INVESTMENT) {
        period.investment += activity.amount;
      }

      if (activity.category !== null) {
        const category = period.categories.find(
          (c) => c.category === activity.category,
        );
        if (!category) return;

        category.value += activity.amount;
      }
    });

    // Processing of balance
    periodsActivityData.forEach((periodActivityData, index) => {
      if (index === 0) {
        const initialBalance = accounts.reduce((balance, account) => {
          return balance + (account.startingBalance ?? 0);
        }, 0);

        periodActivityData.balance =
          initialBalance +
          periodActivityData.revenue -
          periodActivityData.expense;
      } else {
        periodActivityData.balance =
          periodsActivityData[index - 1].balance +
          periodActivityData.revenue -
          periodActivityData.expense;
      }
    });

    return periodsActivityData;
  },

  getPeriodsForecastData: (): PeriodActivityData[] => {
    const { accounts } = useAccounts.getState();
    const { activityCategories: categories } = useActivities.getState();
    const periodsAvailable = get().getPeriodsAvailable();
    const periodsActivityData = get().getPeriodsActivityData();

    const periodsForecastData: PeriodActivityData[] = [];
    periodsAvailable.forEach((period) => {
      periodsForecastData.push({
        ...period,
        expense: 0,
        revenue: 0,
        investment: 0,
        balance: 0,
        categories: [],
      });
    });

    // Processing of forecast and balance
    periodsForecastData.forEach((periodForecastData, index) => {
      const periodLabel = get().getPeriodLabel(periodForecastData);

      categories.forEach((category) => {
        const activityValue =
          periodsActivityData[index].categories.find(
            (c) => c.category === category.id,
          )?.value ?? 0;

        periodForecastData.categories.push({
          category: category.id,
          value: activityValue,
        });
      });

      (
        [
          {
            type: ActivityType.REVENUE,
            key: "revenue" as const,
          },
          {
            type: ActivityType.EXPENSE,
            key: "expense" as const,
          },
          {
            type: ActivityType.INVESTMENT,
            key: "investment" as const,
          },
        ] as {
          type: ActivityType;
          key: "revenue" | "expense" | "investment";
        }[]
      ).forEach(({ key }) => {
        const typeActivityValue = periodsActivityData[index][key];
        periodForecastData[key] = typeActivityValue;
      });

      if (index === 0) {
        const initialBalance = accounts.reduce((balance, account) => {
          return balance + (account.startingBalance ?? 0);
        }, 0);

        periodForecastData.balance =
          initialBalance +
          periodForecastData.revenue -
          periodForecastData.expense;
      } else {
        const previousBalance =
          periodLabel === "Future"
            ? periodsForecastData[index - 1].balance
            : periodsActivityData[index - 1].balance;

        periodForecastData.balance =
          previousBalance +
          periodForecastData.revenue -
          periodForecastData.expense;
      }
    });

    return periodsForecastData;
  },

  getPeriodsAccountData: (): PeriodAccountData[] => {
    const { accounts } = useAccounts.getState();
    const { activities } = useActivities.getState();
    const { movements } = useMovements.getState();
    const periodsAvailable = get().getPeriodsAvailable();

    const periodsAccountData: PeriodAccountData[] = [];
    periodsAvailable.forEach((period) => {
      const periodAccountData: PeriodAccountData = {
        ...period,
        income: 0,
        outcome: 0,
        balance: 0,
        accounts: [],
      };
      accounts
        .filter(
          (a) =>
            a.type !== AccountType.EXPENSE && a.type !== AccountType.REVENUE,
        )
        .forEach((a) => {
          periodAccountData.accounts.push({
            account: a.id,
            income: 0,
            outcome: 0,
            balance: 0,
            cash: {
              in: 0,
              out: 0,
              balance: 0,
            },
          });
        });

      periodsAccountData.push(periodAccountData);
    });

    // Processing of transactions
    activities.forEach((activity) => {
      const activityPeriod = periodsAccountData.find(
        (p) =>
          p.month === activity.date.getMonth() &&
          p.year === activity.date.getFullYear(),
      );
      if (!activityPeriod) return;

      activity.transactions.forEach((transaction) => {
        // From account processing
        const fromAccount = accounts.find(
          (a) => a.id === transaction.fromAccount,
        )!;
        if (fromAccount.type === AccountType.EXPENSE) {
          activityPeriod.outcome -= transaction.amount;
        } else if (fromAccount.type === AccountType.REVENUE) {
          activityPeriod.income += transaction.amount;
        } else {
          const fromAccountData = activityPeriod.accounts.find(
            (a) => a.account === transaction.fromAccount,
          );
          if (fromAccountData) {
            fromAccountData.outcome += transaction.amount;
          }
        }

        // To account processing
        const toAccount = accounts.find((a) => a.id === transaction.toAccount)!;
        if (toAccount.type === AccountType.EXPENSE) {
          activityPeriod.outcome += transaction.amount;
        } else if (toAccount.type === AccountType.REVENUE) {
          activityPeriod.income -= transaction.amount;
        } else {
          const toAccountData = activityPeriod.accounts.find(
            (a) => a.account === transaction.toAccount,
          );
          if (toAccountData) {
            toAccountData.income += transaction.amount;
          }
        }
      });
    });

    // Processing of movements
    movements.forEach((movement) => {
      const movementPeriod = periodsAccountData.find(
        (p) =>
          p.month === movement.date.getMonth() &&
          p.year === movement.date.getFullYear(),
      );
      if (!movementPeriod) return;

      const accountData = movementPeriod.accounts.find(
        (a) => a.account === movement.account,
      );
      if (accountData) {
        if (movement.amount > 0) {
          accountData.cash.in += movement.amount;
        } else {
          accountData.cash.out += movement.amount * -1;
        }
      }
    });

    // Postprocessing of balances
    periodsAccountData.forEach((periodAccountData, index) => {
      let totalBalance = 0;

      periodAccountData.accounts.forEach((accountData, accountIndex) => {
        if (index === 0) {
          const account = accounts.find((a) => a.id === accountData.account)!;
          if (account.startingBalance) {
            accountData.balance =
              account.startingBalance +
              accountData.income -
              accountData.outcome;
          } else {
            accountData.balance = accountData.income - accountData.outcome;
          }

          if (account.startingCashBalance) {
            accountData.cash.balance =
              account.startingCashBalance +
              accountData.cash.in -
              accountData.cash.out;
          } else if (account.startingBalance) {
            accountData.cash.balance =
              account.startingBalance +
              accountData.cash.in -
              accountData.cash.out;
          } else {
            accountData.cash.balance =
              accountData.cash.in - accountData.cash.out;
          }
        } else {
          const previousAccountData =
            periodsAccountData[index - 1].accounts[accountIndex];
          accountData.balance =
            previousAccountData.balance +
            accountData.income -
            accountData.outcome;
          accountData.cash.balance =
            previousAccountData.cash.balance +
            accountData.cash.in -
            accountData.cash.out;
        }

        totalBalance += accountData.balance;
      });

      periodAccountData.balance = totalBalance;
    });

    return periodsAccountData;
  },

  setViewFilters: (filters: Partial<ViewFilters>) => {
    set((state) => ({
      viewFilters: {
        ...state.viewFilters,
        ...filters,
      },
    }));
  },
}));
