import { db } from "@/database";
import { accountsSharing, activitiesSharing, counterparties, transactions } from "@/tables";
import type { Counterparty } from "@maille/core/accounts";
import type { Transaction } from "@maille/core/activities";
import { and, eq, ne } from "drizzle-orm";

type ActivitySharing = {
  user: string;
  transactions: Transaction[];
  counterparties: Counterparty[];
  accountsSharing: {
    account: string;
    accountSharingTo: string;
  }[];
};

export const getActivitySharings = async (
  activityId: string,
  userId: string,
): Promise<ActivitySharing[]> => {
  const activitySharingId = (
    await db.select().from(activitiesSharing).where(eq(activitiesSharing.activity, activityId))
  )[0]?.sharingId;
  const activitySharings = activitySharingId
    ? await db
        .select()
        .from(activitiesSharing)
        .where(
          and(
            eq(activitiesSharing.sharingId, activitySharingId),
            ne(activitiesSharing.activity, activityId),
          ),
        )
    : [];

  return await Promise.all(
    activitySharings.map(async (sharing) => ({
      user: sharing.user,
      transactions: await db
        .select()
        .from(transactions)
        .where(eq(transactions.activity, sharing.activity)),
      counterparties: await db
        .select()
        .from(counterparties)
        .where(eq(counterparties.user, sharing.user)),
      accountsSharing: await getAccountsSharing(userId, sharing.user),
    })),
  );
};

export const getAccountsSharing = async (userId: string, sharingTo: string) => {
  const sharingIds = db
    .select({ sharingId: accountsSharing.sharingId, account: accountsSharing.account })
    .from(accountsSharing)
    .where(eq(accountsSharing.user, userId))
    .as("sharingIds");

  return await db
    .select({ accountSharingTo: accountsSharing.account, account: sharingIds.account })
    .from(accountsSharing)
    .innerJoin(sharingIds, eq(accountsSharing.sharingId, sharingIds.sharingId))
    .where(eq(accountsSharing.user, sharingTo));
};
