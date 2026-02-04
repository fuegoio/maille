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
    <div className="flex min-w-0 shrink-0 items-center">
      {!onlyUser && (
        <div
          className="-ml-1 size-4.5 shrink-0 rounded-xl"
          style={{ backgroundColor: ACCOUNT_TYPES_COLOR[account.type] }}
        />
      )}
      <div className="ml-2 overflow-hidden font-medium text-ellipsis whitespace-nowrap text-white sm:ml-3">
        {account.name}
      </div>
    </div>
  );
}
