import type { MovementFilter } from "@maille/core/movements";
import {
  ActivityFilterDateValues,
} from "@maille/core/activities";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";

interface MovementFilterValueMenuProps {
  modelValue: MovementFilter["value"] | undefined;
  field: MovementFilter["field"];
  onUpdateModelValue: (value: MovementFilter["value"]) => void;
}

export const MovementFilterValueMenu = ({
  modelValue,
  field,
  onUpdateModelValue,
}: MovementFilterValueMenuProps) => {
  const accounts = useAccounts((state) => state.accounts);

  const [textValue, setTextValue] = useState<string | undefined>(
    modelValue as string | undefined,
  );

  const inputClassName =
    "rounded-none border text-xs! focus-visible:border-input focus-visible:ring-0";

  if (field === "date") {
    return (
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as MovementFilter["value"]);
        }}
      >
        <SelectTrigger className={inputClassName}>
          <SelectValue placeholder="Date value" />
        </SelectTrigger>
        <SelectContent>
          {ActivityFilterDateValues.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (field === "amount") {
    return (
      <Input
        type="number"
        value={(modelValue as string | undefined) || ""}
        className={inputClassName}
        onChange={(e) => {
          const value = e.target.value;
          onUpdateModelValue(value === "" ? undefined : parseFloat(value));
        }}
      />
    );
  } else if (field === "name") {
    return (
      <Input
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        className={inputClassName}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onUpdateModelValue(textValue);
          }
        }}
        onBlur={() => {
          onUpdateModelValue(textValue);
        }}
      />
    );
  } else if (field === "account") {
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as MovementFilter["value"]);
        }}
      >
        <MultiSelectTrigger className={inputClassName}>
          <MultiSelectValue
            placeholder="Select an account"
            renderValue={(value) => {
              if (value.length === 1) {
                const accountId = value[0];
                const account = accounts.find((a) => a.id === accountId);
                if (!account) return;
                return (
                  <>
                    <div
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full",
                        ACCOUNT_TYPES_COLOR[account.type],
                      )}
                    />
                    <span>{account.name}</span>
                  </>
                );
              } else {
                return (
                  <>
                    {value.map((accountId, index) => {
                      const account = accounts.find((a) => a.id === accountId);
                      if (!account) return;
                      return (
                        <div
                          key={accountId}
                          className={cn(
                            "h-3 w-3 shrink-0 rounded-full",
                            ACCOUNT_TYPES_COLOR[account.type],
                            index > 0 && "-ml-2",
                          )}
                        />
                      );
                    })}
                    <span>{value.length} accounts</span>
                  </>
                );
              }
            }}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="w-fit">
          {accounts.map((account) => (
            <MultiSelectItem key={account.id} value={account.id}>
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full",
                  ACCOUNT_TYPES_COLOR[account.type],
                )}
              />
              <span>{account.name}</span>
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    );
  } else if (field === "status") {
    const statusValues = ["completed", "incomplete"];
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as MovementFilter["value"]);
        }}
      >
        <MultiSelectTrigger className={inputClassName}>
          <MultiSelectValue
            placeholder="Select a status"
            renderValue={(value) => {
              if (value.length === 1) {
                const status = value[0];
                return (
                  <>
                    <span>{status}</span>
                  </>
                );
              } else {
                return (
                  <>
                    <span>{value.length} statuses</span>
                  </>
                );
              }
            }}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="w-fit">
          {statusValues.map((value) => (
            <MultiSelectItem key={value} value={value}>
              <span>{value}</span>
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    );
  }

  return null;
};

MovementFilterValueMenu.displayName = "MovementFilterValueMenu";