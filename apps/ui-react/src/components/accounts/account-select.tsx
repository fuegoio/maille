import { useStore } from "zustand";
import type { UUID } from "crypto";
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
  modelValue: UUID | null | UUID[] | any;
  onUpdateModelValue: (value: UUID | null | UUID[] | any) => void;
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
      onUpdateModelValue([value as UUID]);
    } else {
      onUpdateModelValue(value === "null" ? null : (value as UUID));
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
        className={`relative rounded px-3 text-left text-sm h-10 flex items-center group transition-colors ${
          borderless
            ? "border-none bg-transparent hover:bg-transparent"
            : "border bg-primary-700 hover:bg-primary-600"
        } ${disabled ? "bg-gray-100" : ""}`}
      >
        <div className="flex items-center flex-1">
          {selectedAccount ? (
            <>
              <div
                className="size-4 rounded-xl mr-2 sm:mr-3 shrink-0 transition-colors -ml-1"
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
                className="h-3 w-3 rounded-xl mr-2 sm:mr-3 shrink-0 bg-primary-300 transition-colors"
                style={{ backgroundColor: borderless ? "inherit" : "#c4b5fd" }}
              />
              <div
                className="truncate font-medium text-primary-200 transition-colors"
                style={{ color: borderless ? "inherit" : "#c4b5fd" }}
              >
                Account
              </div>
            </>
          )}
        </div>
        {!borderless && !disabled && <ChevronDown className="size-4 text-muted-foreground" />}
      </SelectTrigger>
      <SelectContent className="absolute w-56 z-50 max-h-60 overflow-auto rounded-md bg-primary-700 py-1 shadow-lg border focus:outline-none text-sm">
        {accountTypesToDisplay.map((accountType) => (
          <SelectGroup key={accountType}>
            <SelectLabel className="flex items-center px-4 py-3 border-t first:border-t-0">
              <div
                className="h-2 w-2 rounded-xl mr-4 shrink-0"
                style={{ backgroundColor: ACCOUNT_TYPES_COLOR[accountType] }}
              />
              <div className="text-primary-100 font-medium text-xs tracking-wide">
                {ACCOUNT_TYPES_NAME[accountType]}
              </div>
            </SelectLabel>
            {accountsToDisplay
              .filter((a) => a.type === accountType)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="relative cursor-default select-none py-2 pl-10 pr-4 inline-flex items-center w-full">
                    <span className="block truncate flex-1">{account.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
