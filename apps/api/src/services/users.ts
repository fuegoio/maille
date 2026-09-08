import { accounts } from "@/tables";
import { db } from "@/database";
import { AccountType } from "@maille/core/accounts";
import { logger } from "@/logger";

export const createUserAccounts = async (userId: string) => {
  logger.info({ userId }, "Bootstrapping user ...");

  // Create accounts
  const userAccounts = await db
    .insert(accounts)
    .values([
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Revenue",
        type: AccountType.REVENUE,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Expense",
        type: AccountType.EXPENSE,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Cash",
        type: AccountType.CASH,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Assets",
        type: AccountType.ASSETS,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Liabilities",
        type: AccountType.LIABILITIES,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Bank account",
        type: AccountType.BANK_ACCOUNT,
        default: false,
        movements: true,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        name: "Investment account",
        type: AccountType.INVESTMENT_ACCOUNT,
        default: false,
        movements: true,
      },
    ])
    .returning();

  logger.info({ userId }, "User bootstrapped successfully");

  return { accounts: userAccounts };
};
