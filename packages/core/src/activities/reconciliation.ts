import _ from "lodash";

import {
  ActivityType,
  type ActivityAmounts,
  type ActivityStatus,
  type ActivityMovement,
  type Transaction,
  type ActivitySharing,
} from "./types";
import { AccountType, type Counterparty } from "../accounts/index";
import type { Movement, MovementWithLink } from "../movements/types";

type SimpleAccount = {
  id: string;
  type: AccountType;
  movements: boolean;
};

// Maps an account type to the activity type derived from it, if any: the
// activity's types are the set of typed accounts involved in its
// transactions.
const accountTypeToActivityType = (accountType: AccountType): ActivityType | null => {
  if (accountType === AccountType.EXPENSE) {
    return ActivityType.EXPENSE;
  } else if (accountType === AccountType.REVENUE) {
    return ActivityType.REVENUE;
  } else if (accountType === AccountType.INVESTMENT_ACCOUNT) {
    return ActivityType.INVESTMENT;
  }
  return null;
};

/**
 * The activity's derived types: every type whose account kind is involved in
 * at least one transaction leg. Neutral is attached when a transaction has no
 * typed account on either side, or when there are no transactions at all.
 */
export const deriveActivityTypes = (
  transactions: Transaction[],
  accounts: SimpleAccount[],
): ActivityType[] => {
  const types = new Set<ActivityType>();
  let hasNeutral = transactions.length === 0;

  for (const transaction of transactions) {
    const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
    const toAccount = accounts.find((a) => a.id === transaction.toAccount);
    const fromType = fromAccount ? accountTypeToActivityType(fromAccount.type) : null;
    const toType = toAccount ? accountTypeToActivityType(toAccount.type) : null;

    if (fromType) {
      types.add(fromType);
    }
    if (toType) {
      types.add(toType);
    }
    if (!fromType && !toType) {
      hasNeutral = true;
    }
  }

  if (types.size === 0 || hasNeutral) {
    types.add(ActivityType.NEUTRAL);
  }

  return Object.values(ActivityType).filter((activityType) => types.has(activityType));
};

/**
 * The activity's amounts per type. Typed legs contribute to their type:
 * money flowing into an expense or investment account counts positively,
 * money coming from a revenue account counts positively, and the reverse
 * directions negatively. Transactions with no typed account on either side
 * contribute their face amount to neutral.
 */
export const getActivityAmounts = (
  transactions: Transaction[],
  accounts: SimpleAccount[],
): ActivityAmounts => {
  const amounts: ActivityAmounts = {
    [ActivityType.EXPENSE]: 0,
    [ActivityType.REVENUE]: 0,
    [ActivityType.INVESTMENT]: 0,
    [ActivityType.NEUTRAL]: 0,
  };

  for (const transaction of transactions) {
    const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
    const toAccount = accounts.find((a) => a.id === transaction.toAccount);
    const fromType = fromAccount ? accountTypeToActivityType(fromAccount.type) : null;
    const toType = toAccount ? accountTypeToActivityType(toAccount.type) : null;

    if (fromType === ActivityType.EXPENSE) {
      amounts[ActivityType.EXPENSE] -= transaction.amount;
    } else if (fromType === ActivityType.REVENUE) {
      amounts[ActivityType.REVENUE] += transaction.amount;
    } else if (fromType === ActivityType.INVESTMENT) {
      amounts[ActivityType.INVESTMENT] -= transaction.amount;
    }

    if (toType === ActivityType.EXPENSE) {
      amounts[ActivityType.EXPENSE] += transaction.amount;
    } else if (toType === ActivityType.REVENUE) {
      amounts[ActivityType.REVENUE] -= transaction.amount;
    } else if (toType === ActivityType.INVESTMENT) {
      amounts[ActivityType.INVESTMENT] += transaction.amount;
    }

    if (!fromType && !toType) {
      amounts[ActivityType.NEUTRAL] += transaction.amount;
    }
  }

  return {
    [ActivityType.EXPENSE]: _.round(amounts[ActivityType.EXPENSE], 2),
    [ActivityType.REVENUE]: _.round(amounts[ActivityType.REVENUE], 2),
    [ActivityType.INVESTMENT]: _.round(amounts[ActivityType.INVESTMENT], 2),
    [ActivityType.NEUTRAL]: _.round(amounts[ActivityType.NEUTRAL], 2),
  };
};

/**
 * The activity's single total amount: the sum of its per-type amounts. Used
 * for sorting and amount comparisons.
 */
export const getActivityAmountsTotal = (amounts: ActivityAmounts): number => {
  return _.round(
    Object.values(amounts).reduce((total, amount) => total + amount, 0),
    2,
  );
};

/**
 * The per-type sums of a set of activities, in the same shape as a single
 * activity's amounts. Used for group and filtered totals.
 */
export const sumActivityAmounts = (activities: { amounts: ActivityAmounts }[]): ActivityAmounts => {
  const sums: ActivityAmounts = {
    [ActivityType.EXPENSE]: 0,
    [ActivityType.REVENUE]: 0,
    [ActivityType.INVESTMENT]: 0,
    [ActivityType.NEUTRAL]: 0,
  };
  for (const { amounts } of activities) {
    sums.expense += amounts.expense;
    sums.revenue += amounts.revenue;
    sums.investment += amounts.investment;
    sums.neutral += amounts.neutral;
  }
  return sums;
};

export const getActivityStatus = (
  activityDate: Date,
  transactions: Transaction[],
  movements: ActivityMovement[],
  accounts: SimpleAccount[],
  getMovementById: (id: string) => Movement | undefined,
): ActivityStatus => {
  if (activityDate > new Date()) {
    return "scheduled";
  }

  if (!getActivityMovementsReconciliated(transactions, movements, accounts, getMovementById)) {
    return "incomplete";
  } else {
    return "completed";
  }
};

export const getActivityMovementsByAccount = (
  movements: ActivityMovement[],
  getMovementById: (id: string) => Movement | undefined,
) => {
  return movements.reduce(
    (movementsByAccount, movementActivity) => {
      const movement = getMovementById(movementActivity.movement);
      if (!movement) return movementsByAccount;

      let movementsOfAccount = movementsByAccount.find((mvb) => mvb.account === movement.account);
      if (!movementsOfAccount) {
        movementsOfAccount = {
          account: movement.account,
          total: 0,
          movements: [],
        };
        movementsByAccount.push(movementsOfAccount);
      }

      movementsOfAccount.total += movementActivity.amount;
      movementsOfAccount.movements.push({
        ...movement,
        movementActivityId: movementActivity.id,
        amountLinked: movementActivity.amount,
      });

      return movementsByAccount;
    },
    [] as {
      account: string;
      total: number;
      movements: MovementWithLink[];
    }[],
  );
};

export const getActivityTransactionsSumByAccount = (
  transactions: Transaction[],
  accounts: SimpleAccount[],
) => {
  return transactions.reduce(
    (transactionsSumByAccount, transaction) => {
      const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
      if (!fromAccount) return transactionsSumByAccount;

      const toAccount = accounts.find((a) => a.id === transaction.toAccount);
      if (!toAccount) return transactionsSumByAccount;

      let transactionsSumOfFromAccount = transactionsSumByAccount.find(
        (tvb) => tvb.account === transaction.fromAccount,
      );
      if (!transactionsSumOfFromAccount && transaction.fromAccount) {
        transactionsSumOfFromAccount = {
          account: transaction.fromAccount,
          total: 0,
        };
        transactionsSumByAccount.push(transactionsSumOfFromAccount);
      }
      if (transactionsSumOfFromAccount) {
        transactionsSumOfFromAccount.total += transaction.amount * -1;
      }

      let transactionsSumOfToAccount = transactionsSumByAccount.find(
        (tvb) => tvb.account === transaction.toAccount,
      );
      if (!transactionsSumOfToAccount && transaction.toAccount) {
        transactionsSumOfToAccount = {
          account: transaction.toAccount,
          total: 0,
        };
        transactionsSumByAccount.push(transactionsSumOfToAccount);
      }
      if (transactionsSumOfToAccount) {
        transactionsSumOfToAccount.total += transaction.amount;
      }

      return transactionsSumByAccount;
    },
    [] as { account: string; total: number }[],
  );
};

export const getActivityMovementsReconciliatedByAccount = (
  transactions: Transaction[],
  movements: ActivityMovement[],
  accounts: SimpleAccount[],
  getMovementById: (id: string) => Movement | undefined,
) => {
  const transactionsSumByAccount = getActivityTransactionsSumByAccount(transactions, accounts);
  const movementsByAccount = getActivityMovementsByAccount(movements, getMovementById);

  return accounts.reduce(
    (movementsReconciliatedByAccount, account) => {
      if (!account.movements) {
        return movementsReconciliatedByAccount;
      }

      const transactionsSumOfAccount = transactionsSumByAccount.find(
        (tsba) => tsba.account === account.id,
      );

      const movementsReconciliatedOfAccount = {
        account: account.id,
        reconcilied: false,
        transactionTotal: transactionsSumOfAccount?.total ?? 0,
        movementTotal: 0,
        movements: [] as MovementWithLink[],
      };

      const movementsOfAccount = movementsByAccount.find((mvb) => mvb.account === account.id);
      if (movementsOfAccount) {
        movementsReconciliatedOfAccount.movementTotal = movementsOfAccount.total;
        movementsReconciliatedOfAccount.movements = movementsOfAccount.movements;
      }

      if (!transactionsSumOfAccount && movementsReconciliatedOfAccount.movements.length === 0) {
        return movementsReconciliatedByAccount;
      }

      if (
        _.round(movementsReconciliatedOfAccount.transactionTotal, 2) ===
          _.round(movementsReconciliatedOfAccount.movementTotal, 2) &&
        movementsReconciliatedOfAccount.movements.length > 0
      ) {
        movementsReconciliatedOfAccount.reconcilied = true;
      }

      movementsReconciliatedByAccount.push(movementsReconciliatedOfAccount);
      return movementsReconciliatedByAccount;
    },
    [] as {
      account: string;
      reconcilied: boolean;
      transactionTotal: number;
      movementTotal: number;
      movements: MovementWithLink[];
    }[],
  );
};

export const getActivityMovementsReconciliated = (
  transactions: Transaction[],
  movements: ActivityMovement[],
  accounts: SimpleAccount[],
  getMovementById: (id: string) => Movement | undefined,
): boolean => {
  const movementsReconciliatedByAccount = getActivityMovementsReconciliatedByAccount(
    transactions,
    movements,
    accounts,
    getMovementById,
  );
  return movementsReconciliatedByAccount.every((mrba) => mrba.reconcilied);
};

export const getActivitySharingsReconciliation = (
  activitySharings: {
    user: string;
    transactions: Transaction[];
    counterparties: Counterparty[];
    accountsSharing: {
      account: string;
      accountSharingTo: string;
    }[];
  }[],
  user: string,
): ActivitySharing[] => {
  return activitySharings.map((activitySharing) => {
    const liabilitySum = activitySharing.transactions.reduce((s, transaction) => {
      let amount = 0;
      if (transaction.fromCounterparty) {
        const fromCounterparty = activitySharing.counterparties.find(
          (c) => c.id === transaction.fromCounterparty,
        );
        if (fromCounterparty?.contact === user) {
          amount += transaction.amount;
        }
      }

      if (transaction.toCounterparty) {
        const toCounterparty = activitySharing.counterparties.find(
          (c) => c.id === transaction.toCounterparty,
        );
        if (toCounterparty?.contact === user) {
          amount += transaction.amount * -1;
        }
      }
      return amount + s;
    }, 0);

    const accountsSharingReconciliation = activitySharing.transactions.reduce(
      (accountsReconciliation, transaction) => {
        const fromAccountSharing = activitySharing.accountsSharing.find(
          (as) => as.accountSharingTo === transaction.fromAccount,
        );
        if (fromAccountSharing) {
          const account = accountsReconciliation.find(
            (a) => a.account === fromAccountSharing.account,
          );
          if (account) {
            account.amount += transaction.amount * -1;
          } else {
            accountsReconciliation.push({
              account: fromAccountSharing.account,
              amount: transaction.amount * -1,
            });
          }
        }

        const toAccountSharing = activitySharing.accountsSharing.find(
          (as) => as.accountSharingTo === transaction.toAccount,
        );
        if (toAccountSharing) {
          const account = accountsReconciliation.find(
            (a) => a.account === toAccountSharing.account,
          );
          if (account) {
            account.amount += transaction.amount;
          } else {
            accountsReconciliation.push({
              account: toAccountSharing.account,
              amount: transaction.amount,
            });
          }
        }

        return accountsReconciliation;
      },
      [] as { account: string; amount: number }[],
    );

    return {
      user: activitySharing.user,
      liability: liabilitySum,
      accounts: accountsSharingReconciliation,
    };
  });
};
