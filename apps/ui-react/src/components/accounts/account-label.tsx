import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useAccounts, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";

interface AccountLabelProps {
  accountId: string;
}

export function AccountLabel({ accountId }: AccountLabelProps) {
  const accounts = useAccounts((state) => state.accounts);

  const account = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  if (!account) return null;

  return (
    <div className="flex min-w-0 shrink-0 items-center">
      <div
        className={cn(
          "size-3 shrink-0 rounded-xl",
          ACCOUNT_TYPES_COLOR[account.type],
        )}
      />
      <div className="ml-2 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">
        {account.name}
      </div>
    </div>
  );
}
