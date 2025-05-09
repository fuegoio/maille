import { createUser } from "@/api/auth";
import { db } from "@/database";
import { accounts, activityCategories, users } from "@/tables";
import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import { logger } from "./logger";

export const bootstrapUsers = async () => {
  logger.info("Bootstrapping first user ...");
  const userExisting =
    (await db.select().from(users).limit(1))[0] !== undefined;
  if (userExisting) {
    logger.info("A user already exists, skipping bootstrap of first user");
    return;
  }

  const email = process.env.USER_EMAIL ?? "admin";
  const firstName = process.env.USER_FIRST_NAME ?? "Admin";
  const lastName = process.env.USER_LAST_NAME ?? "";
  const password = Math.random().toString(36).slice(-16);

  const user = await createUser(email, password, firstName, lastName);

  // Create accounts
  const liabilityAccountId = crypto.randomUUID();
  await db.insert(accounts).values([
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Revenue",
      type: AccountType.REVENUE,
      default: true,
      movements: false,
    },
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Expense",
      type: AccountType.EXPENSE,
      default: true,
      movements: false,
    },
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Cash",
      type: AccountType.CASH,
      default: true,
      movements: false,
    },
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Liabilities",
      type: AccountType.LIABILITIES,
      default: true,
      movements: false,
    },
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Bank account",
      type: AccountType.BANK_ACCOUNT,
      default: false,
      movements: true,
    },
    {
      id: crypto.randomUUID(),
      user: user.id,
      name: "Investment account",
      type: AccountType.INVESTMENT_ACCOUNT,
      default: false,
      movements: true,
    },
  ]);

  // Create categories
  await db.insert(activityCategories).values([
    {
      id: liabilityAccountId,
      user: user.id,
      name: "Salary",
      type: ActivityType.REVENUE,
    },
  ]);

  logger.info(
    {
      email,
      password,
      firstName,
      lastName,
    },
    `User created successfully`,
  );
};
