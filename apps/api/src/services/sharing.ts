import { db } from "@/database";
import { accountsSharing, activitiesSharing, counterparties, transactions } from "@/tables";
import type { Counterparty } from "@maille/core/accounts";
import type { Transaction } from "@maille/core/activities";
import { and, eq, ne } from "drizzle-orm";

type ActivitySharing = {
  user: string;
  transactions: Transaction[];
  counterparties: Counterparty[];
  accountsSharing: { account: string; user: string }[];
};

export const getActivitySharings = async (activityId: string): Promise<ActivitySharing[]> => {
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
      accountsSharing: await getAccountsSharing(sharing.user),
    })),
  );
};

export const getAccountsSharing = async (userId: string) => {
  const sharingIds = db
    .select({ sharingId: accountsSharing.sharingId })
    .from(accountsSharing)
    .where(eq(accountsSharing.user, userId))
    .as("sharingIds");

  return await db
    .select({ account: accountsSharing.account, user: accountsSharing.user })
    .from(accountsSharing)
    .innerJoin(sharingIds, eq(accountsSharing.sharingId, sharingIds.sharingId))
    .where(ne(accountsSharing.user, userId));
};
