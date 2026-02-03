import _ from "lodash";
import type { UUID } from "crypto";

import {
  ActivityType,
  type ActivityStatus,
  type ActivityMovement,
  type Transaction,
} from "./types.js";
import { AccountType, type Account } from "../accounts/index.js";
import type { Movement, MovementWithLink } from "../movements/types.js";

export const getActivityStatus = (
  activityDate: Date,
  transactions: Transaction[],
  movements: ActivityMovement[],
  accounts: Account[],
  getMovementById: (id: UUID) => Movement | undefined,
): ActivityStatus => {
  if (activityDate > new Date()) {
    return "scheduled";
  }

  if (
    !getActivityMovementsReconciliated(
      transactions,
      movements,
      accounts,
      getMovementById,
    )
  ) {
    return "incomplete";
  } else {
    return "completed";
  }
};

export const getActivityTransactionsReconciliationSum = (
  activityType: ActivityType,
  transactions: Transaction[],
  accounts: Account[],
): number => {
  return _.round(
    transactions.reduce((s, transaction) => {
      let amountTakenIntoAccount = 0;
      if (activityType === ActivityType.NEUTRAL) {
        amountTakenIntoAccount = transaction.amount;
      } else {
        if (transaction.fromAccount === undefined) return s;
        const fromAccount = accounts.find(
          (a) => a.id === transaction.fromAccount,
        );
        if (!fromAccount) return s;

        if (
          activityType === ActivityType.EXPENSE &&
          fromAccount.type === AccountType.EXPENSE
        ) {
          amountTakenIntoAccount += transaction.amount * -1;
        } else if (
          activityType === ActivityType.REVENUE &&
          fromAccount.type === AccountType.REVENUE
        ) {
          amountTakenIntoAccount += transaction.amount;
        } else if (
          activityType === ActivityType.INVESTMENT &&
          fromAccount.type === AccountType.INVESTMENT_ACCOUNT
        ) {
          amountTakenIntoAccount += transaction.amount * -1;
        }

        if (transaction.toAccount === undefined) return s;
        const toAccount = accounts.find((a) => a.id === transaction.toAccount);
        if (!toAccount) return s;

        if (
          activityType === ActivityType.EXPENSE &&
          toAccount.type === AccountType.EXPENSE
        ) {
          amountTakenIntoAccount += transaction.amount;
        } else if (
          activityType === ActivityType.REVENUE &&
          toAccount.type === AccountType.REVENUE
        ) {
          amountTakenIntoAccount += transaction.amount * -1;
        } else if (
          activityType === ActivityType.INVESTMENT &&
          toAccount.type === AccountType.INVESTMENT_ACCOUNT
        ) {
          amountTakenIntoAccount += transaction.amount;
        }
      }

      return s + amountTakenIntoAccount;
    }, 0),
    2,
  );
};

export const getActivityMovementsByAccount = (
  movements: ActivityMovement[],
  getMovementById: (id: UUID) => Movement | undefined,
) => {
  return movements.reduce(
    (movementsByAccount, movementActivity) => {
      const movement = getMovementById(movementActivity.movement);
      if (!movement) return movementsByAccount;

      let movementsOfAccount = movementsByAccount.find(
        (mvb) => mvb.account === movement.account,
      );
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
      account: UUID;
      total: number;
      movements: MovementWithLink[];
    }[],
  );
};

export const getActivityTransactionsSumByAccount = (
  transactions: Transaction[],
  accounts: Account[],
) => {
  return transactions.reduce(
    (transactionsSumByAccount, transaction) => {
      const fromAccount = accounts.find(
        (a) => a.id === transaction.fromAccount,
      );
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
    [] as { account: UUID; total: number }[],
  );
};

export const getActivityMovementsReconciliatedByAccount = (
  transactions: Transaction[],
  movements: ActivityMovement[],
  accounts: Account[],
  getMovementById: (id: UUID) => Movement | undefined,
) => {
  const transactionsSumByAccount = getActivityTransactionsSumByAccount(
    transactions,
    accounts,
  );
  const movementsByAccount = getActivityMovementsByAccount(
    movements,
    getMovementById,
  );

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

      const movementsOfAccount = movementsByAccount.find(
        (mvb) => mvb.account === account.id,
      );
      if (movementsOfAccount) {
        movementsReconciliatedOfAccount.movementTotal =
          movementsOfAccount.total;
        movementsReconciliatedOfAccount.movements =
          movementsOfAccount.movements;
      }

      if (
        !transactionsSumOfAccount &&
        movementsReconciliatedOfAccount.movements.length === 0
      ) {
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
      account: UUID;
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
  accounts: Account[],
  getMovementById: (id: UUID) => Movement | undefined,
): boolean => {
  const movementsReconciliatedByAccount =
    getActivityMovementsReconciliatedByAccount(
      transactions,
      movements,
      accounts,
      getMovementById,
    );
  return movementsReconciliatedByAccount.every((mrba) => mrba.reconcilied);
};
