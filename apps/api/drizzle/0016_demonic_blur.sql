ALTER TABLE "transactions" ADD COLUMN "fund_moves" jsonb;--> statement-breakpoint
-- Fold the fund move collection into its transactions: a leg exists only
-- as part of its transaction. Drizzle stores timestamps as UTC ISO, so the
-- date is reproduced with the same wall time the API used to serve.
UPDATE "transactions" SET "fund_moves" = (
  SELECT jsonb_agg(jsonb_build_object(
    'id', fm.id,
    'fromFund', fm.from_fund,
    'toFund', fm.to_fund,
    'amount', fm.amount,
    'date', to_char(fm.date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'note', fm.note
  ) ORDER BY fm.date)
  FROM fund_moves fm WHERE fm.transaction = "transactions".id
);--> statement-breakpoint
DROP TABLE "fund_moves" CASCADE;
