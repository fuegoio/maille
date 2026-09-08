import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";

/** An account named with its type swatch, as quiet row metadata. */
export function AccountFlowLabel({ accountId }: { accountId: string }) {
  const accounts = useAccounts((state) => state.accounts);
  const account = accounts.find((a) => a.id === accountId);

  if (!account) return null;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div
        className={cn(
          "size-3 shrink-0 rounded-xl",
          ACCOUNT_TYPES_COLOR[account.type],
        )}
      />
      <span className="max-w-32 truncate text-ellipsis whitespace-nowrap">
        {account.name}
      </span>
    </div>
  );
}
