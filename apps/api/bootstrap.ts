import { createUser } from "@/api/auth";
import { db } from "@/database";
import { accounts, activityCategories, contacts } from "@/tables";
import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";

// Create admin user
const user = await createUser("admin", "admin", "Admin", "");
const user2 = await createUser("admin2", "admin", "Admin", "");

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

  {
    id: liabilityAccountId,
    user: user.id,
    name: "Admin 2 liability",
    type: AccountType.LIABILITIES,
    default: false,
    movements: false,
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

// Create contact
await db.insert(contacts).values({
  id: crypto.randomUUID(),
  user: user.id,
  contact: user2.id,
  contactEmail: user2.email,
  approved: true,
  liabilityAccount: liabilityAccountId,
});
