import { useStore } from "zustand";
import { accountsStore, ACCOUNT_TYPES_COLOR, ACCOUNT_TYPES_NAME } from "@/stores/accounts";
import { AccountType } from "@maille/core/accounts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface AccountSelectProps {
  modelValue: string | null | string[] | any;
  onUpdateModelValue: (value: string | null | string[] | any) => void;
  disabled?: boolean;
  movementsOnly?: boolean;
  borderless?: boolean;
  multiple?: boolean;
  className?: string;
}

export function AccountSelect({
  modelValue,
  onUpdateModelValue,
  disabled = false,
  movementsOnly = false,
  borderless = false,
  multiple = false,
}: AccountSelectProps) {
  const accounts = useStore(accountsStore, (state) => state.accounts);

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

  const handleValueChange = (value: string) => {
    if (multiple) {
      // For multiple selection, we'd need a different approach
      // This is a simplified version
      onUpdateModelValue([value as string]);
    } else {
      onUpdateModelValue(value === "null" ? null : (value as string));
    }
  };

  const getCurrentValue = () => {
    if (multiple && Array.isArray(modelValue)) {
      return modelValue[0]?.toString() || "null";
    } else {
      return modelValue?.toString() || "null";
    }
  };

  const getSelectedAccount = () => {
    const currentValue = getCurrentValue();
    if (currentValue === "null") return null;
    return accounts.find((a) => a.id.toString() === currentValue);
  };

  const selectedAccount = getSelectedAccount();

  return (
    <Select value={getCurrentValue()} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        className={`group relative flex h-10 items-center rounded px-3 text-left text-sm transition-colors ${
          borderless
            ? "border-none bg-transparent hover:bg-transparent"
            : "bg-primary-700 hover:bg-primary-600 border"
        } ${disabled ? "bg-gray-100" : ""}`}
      >
        <div className="flex flex-1 items-center">
          {selectedAccount ? (
            <>
              <div
                className="mr-2 -ml-1 size-4 shrink-0 rounded-xl transition-colors sm:mr-3"
                style={{ backgroundColor: ACCOUNT_TYPES_COLOR[selectedAccount.type] }}
              />
              <div
                className="truncate font-medium text-white transition-colors"
                style={{ color: borderless ? "inherit" : "white" }}
              >
                {selectedAccount.name}
              </div>
            </>
          ) : (
            <>
              <div
                className="bg-primary-300 mr-2 h-3 w-3 shrink-0 rounded-xl transition-colors sm:mr-3"
                style={{ backgroundColor: borderless ? "inherit" : "#c4b5fd" }}
              />
              <div
                className="text-primary-200 truncate font-medium transition-colors"
                style={{ color: borderless ? "inherit" : "#c4b5fd" }}
              >
                Account
              </div>
            </>
          )}
        </div>
        {!borderless && !disabled && <ChevronDown className="size-4 text-muted-foreground" />}
      </SelectTrigger>
      <SelectContent className="bg-primary-700 absolute z-50 max-h-60 w-56 overflow-auto rounded-md border py-1 text-sm shadow-lg focus:outline-none">
        {accountTypesToDisplay.map((accountType) => (
          <SelectGroup key={accountType}>
            <SelectLabel className="flex items-center border-t px-4 py-3 first:border-t-0">
              <div
                className="mr-4 h-2 w-2 shrink-0 rounded-xl"
                style={{ backgroundColor: ACCOUNT_TYPES_COLOR[accountType] }}
              />
              <div className="text-primary-100 text-xs font-medium tracking-wide">
                {ACCOUNT_TYPES_NAME[accountType]}
              </div>
            </SelectLabel>
            {accountsToDisplay
              .filter((a) => a.type === accountType)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="relative inline-flex w-full cursor-default items-center py-2 pr-4 pl-10 select-none">
                    <span className="block flex-1 truncate">{account.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
