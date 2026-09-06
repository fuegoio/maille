import { db } from "@/database";
import { builder } from "../builder";
import { FundSchema, FundMoveSchema } from "./schemas";
import { funds, fundMoves } from "@/tables";
import { eq } from "drizzle-orm";

export const registerFundsQueries = () => {
  builder.queryField("funds", (t) =>
    t.field({
      type: [FundSchema],
      resolve: async (root, args, ctx) => {
        return await db.select().from(funds).where(eq(funds.user, ctx.user.id));
      },
    }),
  );

  builder.queryField("fundMoves", (t) =>
    t.field({
      type: [FundMoveSchema],
      resolve: async (root, args, ctx) => {
        const moves = await db.select().from(fundMoves).where(eq(fundMoves.user, ctx.user.id));
        return moves.map((move) => ({
          ...move,
          date: move.date,
        }));
      },
    }),
  );
};
