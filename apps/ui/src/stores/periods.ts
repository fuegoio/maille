import dayjs from "dayjs";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  Period,
  PeriodAccountData,
  PeriodActivityData,
} from "@/types/periods";
import { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import { useActivitiesStore } from "./activities";
import { useAccountsStore } from "./accounts";
import { useMovementsStore } from "./movements";
import { useSettingsStore } from "./settings";
import type { UUID } from "crypto";

const NUMBER_OF_PERIODS_AVANCE = 12;

export const usePeriodsStore = defineStore("periods", () => {
  const viewFilters = ref({
    category: null as UUID | null,
    subcategory: null as UUID | null,
    activityType: null as ActivityType | null,
    account: null as UUID | null,
  });

  const getPeriodLabel = (
    period: Period,
  ): "Completed" | "Current" | "Future" => {
    const now = dayjs();

    if (now.month(period.month).year(period.year) < now) {
      return "Completed";
    } else if (period.year === now.year() && period.month === now.month()) {
      return "Current";
    } else {
      return "Future";
    }
  };

  const periodsAvailable = computed<Period[]>(() => {
    const { settings } = useSettingsStore();

    const now = dayjs();
    const numberOfPeriods =
      now.diff(dayjs(settings.startingPeriod), "month") +
      NUMBER_OF_PERIODS_AVANCE;
    const periods: Period[] = [];

    for (let month = 0; month < numberOfPeriods; month++) {
      const date = dayjs(settings.startingPeriod).add(month, "month");
      periods.push({
        month: date.month(),
        year: date.year(),
      });
    }

    return periods;
  });

  const periodsActivityData = computed<PeriodActivityData[]>(() => {
    const { accounts } = useAccountsStore();
    const { activities } = useActivitiesStore();
    const { categories } = useActivitiesStore();

    const periodsActivityData: PeriodActivityData[] = [];
    periodsAvailable.value.forEach((period) => {
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
          p.month === activity.date.month() && p.year === activity.date.year(),
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
  });

  const periodsForecastData = computed<PeriodActivityData[]>(() => {
    const { accounts } = useAccountsStore();
    const { categories } = useActivitiesStore();

    const periodsForecastData: PeriodActivityData[] = [];
    periodsAvailable.value.forEach((period) => {
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
      const periodLabel = getPeriodLabel(periodForecastData);

      categories.forEach((category) => {
        const activityValue =
          periodsActivityData.value[index].categories.find(
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
            key: "revenue",
          },
          {
            type: ActivityType.EXPENSE,
            key: "expense",
          },
          {
            type: ActivityType.INVESTMENT,
            key: "investment",
          },
        ] as {
          type: ActivityType;
          key: "revenue" | "expense" | "investment";
        }[]
      ).forEach(({ key }) => {
        const typeActivityValue = periodsActivityData.value[index][key];
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
            : periodsActivityData.value[index - 1].balance;

        periodForecastData.balance =
          previousBalance +
          periodForecastData.revenue -
          periodForecastData.expense;
      }
    });

    return periodsForecastData;
  });

  const periodsAccountData = computed<PeriodAccountData[]>(() => {
    const { accounts } = useAccountsStore();
    const { activities } = useActivitiesStore();
    const { movements } = useMovementsStore();

    const periodsAccountData: PeriodAccountData[] = [];
    periodsAvailable.value.forEach((period) => {
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
          p.month === activity.date.month() && p.year === activity.date.year(),
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
          p.month === movement.date.month() && p.year === movement.date.year(),
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
  });

  return {
    viewFilters,

    getPeriodLabel,

    periodsAvailable,
    periodsActivityData,
    periodsForecastData,
    periodsAccountData,
  };
});
