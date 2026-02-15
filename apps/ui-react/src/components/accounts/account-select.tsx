import { AccountType } from "@maille/core/accounts";
import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, ACCOUNT_TYPES_NAME } from "@/stores/accounts";

import { AccountLabel } from "./account-label";

interface AccountSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  movementsOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export function AccountSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Account",
  movementsOnly = false,
}: AccountSelectProps) {
  const accounts = useAccounts((state) => state.accounts);

  const accountsToDisplay = useMemo(() => {
    if (movementsOnly) return accounts.filter((a) => a.movements);
    return accounts;
  }, [accounts, movementsOnly]);

  const accountTypesToDisplay = useMemo(() => {
    return [
      AccountType.BANK_ACCOUNT,
      AccountType.INVESTMENT_ACCOUNT,
      AccountType.CASH,
      AccountType.LIABILITIES,
      AccountType.REVENUE,
      AccountType.EXPENSE,
    ].filter((accountType) => {
      return accountsToDisplay.filter((a) => a.type === accountType).length > 0;
    });
  }, [accountsToDisplay]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue
          placeholder={
            <div className="flex min-w-0 shrink-0 items-center">
              <div className="size-3.5 shrink-0 rounded-xl bg-gray-200" />
              <div className="ml-2 overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                {placeholder}
              </div>
            </div>
          }
        />
      </SelectTrigger>
      <SelectContent>
        {accountTypesToDisplay.map((accountType) => (
          <SelectGroup key={accountType}>
            <SelectLabel>{ACCOUNT_TYPES_NAME[accountType]}</SelectLabel>
            {accountsToDisplay
              .filter((a) => a.type === accountType)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <AccountLabel accountId={account.id} />
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
