import { writeFileSync } from "fs";
import { lexicographicSortSchema, printSchema } from "graphql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/database";
import { logger } from "@/logger";
import { startServer } from "@/server";
import { schema } from "@/api";

logger.info("Maille API Server");

logger.info("Database initializing...");
migrate(db, { migrationsFolder: "./drizzle" });
logger.info("Database initialized successfully");

logger.info("Compiling GraphQL schema...");
writeFileSync("./schema.graphql", printSchema(lexicographicSortSchema(schema)));
logger.info("GraphQL schema compiled successfully");

startServer();
