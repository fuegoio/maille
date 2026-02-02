import { accounts, workspaces } from "@/tables";
import { db } from "@/database";
import type { UUID } from "crypto";
import { AccountType } from "@maille/core/accounts";
import { logger } from "@/logger";

export const bootstrapUser = async (userId: UUID) => {
  logger.info({ userId }, "Bootstrapping user ...");

  // Get or create a default workspace
  const workspace = await db
    .select()
    .from(workspaces)
    .limit(1)
    .then((res) => res[0]);

  if (!workspace) {
    throw new Error("No workspace found for user");
  }

  // Create accounts
  const userAccounts = await db
    .insert(accounts)
    .values([
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
        name: "Revenue",
        type: AccountType.REVENUE,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
        name: "Expense",
        type: AccountType.EXPENSE,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
        name: "Cash",
        type: AccountType.CASH,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
        name: "Liabilities",
        type: AccountType.LIABILITIES,
        default: true,
        movements: false,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
        name: "Bank account",
        type: AccountType.BANK_ACCOUNT,
        default: false,
        movements: true,
      },
      {
        id: crypto.randomUUID(),
        user: userId,
        workspace: workspace.id,
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
