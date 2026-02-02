import { createUser } from "@/api/auth";
import { db } from "@/database";
import { activityCategories, users, workspaces } from "@/tables";
import { ActivityType } from "@maille/core/activities";
import { logger } from "./logger";
import { bootstrapUser } from "./services/users";

export const bootstrapInstance = async () => {
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
  await bootstrapUser(user.id);

  logger.info(
    { email, password },
    "First user created, you can now login with these credentials",
  );

  // Create categories
  logger.info("Bootstrapping categories...");
  const workspace = await db
    .select()
    .from(workspaces)
    .limit(1)
    .then((res) => res[0]);

  if (workspace) {
    await db.insert(activityCategories).values([
      {
        id: crypto.randomUUID(),
        user: user.id,
        workspace: workspace.id,
        name: "Salary",
        type: ActivityType.REVENUE,
      },
    ]);
  }
  logger.info("Categories bootstrapped successfully");
};
