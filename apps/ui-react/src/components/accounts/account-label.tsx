import { useStore } from "zustand";
import type { UUID } from "crypto";
import { accountsStore, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";
import { useMemo } from "react";

interface AccountLabelProps {
  accountId: UUID;
  onlyUser?: boolean;
}

export function AccountLabel({ accountId, onlyUser = false }: AccountLabelProps) {
  const accounts = useStore(accountsStore, (state) => state.accounts);

  const account = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  if (!account) return null;

  return (
    <div className="flex items-center min-w-0 shrink-0">
      {!onlyUser && (
        <div
          className="size-4.5 rounded-xl shrink-0 -ml-1"
          style={{ backgroundColor: ACCOUNT_TYPES_COLOR[account.type] }}
        />
      )}
      <div className="font-medium text-ellipsis whitespace-nowrap overflow-hidden text-white ml-2 sm:ml-3">
        {account.name}
      </div>
    </div>
  );
}
