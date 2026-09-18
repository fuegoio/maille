import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { useAccounts, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";

interface AccountLabelProps {
  accountId: string;
  size?: "default" | "sm";
}

export function AccountLabel({
  accountId,
  size = "default",
}: AccountLabelProps) {
  const accounts = useAccounts((state) => state.accounts);

  const account = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  if (!account) return null;

  return (
    <div className="flex min-w-0 items-center">
      <div
        className={cn(
          "shrink-0 rounded-full",
          size === "sm" ? "size-1.5" : "size-3",
          ACCOUNT_TYPES_COLOR[account.type],
        )}
      />
      <div
        className={cn(
          "truncate",
          size === "sm" ? "ml-1.5 text-xs" : "ml-2 text-sm font-medium",
        )}
      >
        {account.name}
      </div>
    </div>
  );
}
