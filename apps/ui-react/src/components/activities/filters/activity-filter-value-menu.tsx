import {
  ActivityFilterDateValues,
  ActivityType,
} from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";
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
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

interface ActivityFilterValueMenuProps {
  modelValue: ActivityFilter["value"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["value"]) => void;
}

export const ActivityFilterValueMenu = ({
  modelValue,
  field,
  onUpdateModelValue,
}: ActivityFilterValueMenuProps) => {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
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
          onUpdateModelValue(value as ActivityFilter["value"]);
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
  } else if (field === "name" || field === "description") {
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
  } else if (field === "type") {
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
      >
        <MultiSelectTrigger className={inputClassName}>
          <MultiSelectValue
            placeholder="Select a type"
            renderValue={(value) => {
              if (value.length === 1) {
                const activityType = value[0] as ActivityType;
                return (
                  <>
                    <div
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full",
                        ACTIVITY_TYPES_COLOR[activityType],
                      )}
                    />
                    <span>{ACTIVITY_TYPES_NAME[activityType]}</span>
                  </>
                );
              } else {
                return (
                  <>
                    {value.map((activityType, index) => (
                      <div
                        key={activityType}
                        className={cn(
                          "h-3 w-3 shrink-0 rounded-full",
                          ACTIVITY_TYPES_COLOR[activityType as ActivityType],
                          index > 0 && "-ml-2",
                        )}
                      />
                    ))}
                    <span>{value.length} types</span>
                  </>
                );
              }
            }}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="w-fit">
          {Object.values(ActivityType).map((value) => (
            <MultiSelectItem key={value} value={value}>
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full",
                  ACTIVITY_TYPES_COLOR[value],
                )}
              />
              <span>{ACTIVITY_TYPES_NAME[value]}</span>
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    );
  } else if (field === "category") {
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
      >
        <MultiSelectTrigger className={inputClassName}>
          <MultiSelectValue
            placeholder="Select a category"
            renderValue={(value) => {
              if (value.length === 1) {
                const categoryId = value[0];
                const category = categories.find((c) => c.id === categoryId);
                if (!category) return;
                return (
                  <>
                    {category.emoji && (
                      <span className="mr-0.5">{category.emoji}</span>
                    )}
                    {category.name}
                  </>
                );
              } else {
                return (
                  <>
                    {value.map((categoryId) => {
                      const category = categories.find(
                        (c) => c.id === categoryId,
                      );
                      if (!category || !category.emoji) return;

                      return <span key={categoryId}>{category.emoji}</span>;
                    })}
                    <span>{value.length} categories</span>
                  </>
                );
              }
            }}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="w-fit">
          {categories.map((cat) => (
            <MultiSelectItem key={cat.id} value={cat.id}>
              {cat.emoji && <span className="mr-0.5">{cat.emoji}</span>}
              {cat.name}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    );
  } else if (field === "subcategory") {
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
      >
        <MultiSelectTrigger className={inputClassName}>
          <MultiSelectValue
            placeholder="Select a subcategory"
            renderValue={(value) => {
              if (value.length === 1) {
                const subcategoryId = value[0];
                const subcategory = subcategories.find(
                  (c) => c.id === subcategoryId,
                );
                if (!subcategory) return;
                return (
                  <>
                    {subcategory.emoji && (
                      <span className="mr-0.5">{subcategory.emoji}</span>
                    )}
                    {subcategory.name}
                  </>
                );
              } else {
                return (
                  <>
                    {value.map((subcategoryId) => {
                      const subcategory = subcategories.find(
                        (c) => c.id === subcategoryId,
                      );
                      if (!subcategory || !subcategory.emoji) return;

                      return (
                        <span key={subcategoryId}>{subcategory.emoji}</span>
                      );
                    })}
                    <span>{value.length} subcategories</span>
                  </>
                );
              }
            }}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="w-fit">
          {subcategories.map((subcat) => (
            <MultiSelectItem key={subcat.id} value={subcat.id}>
              {subcat.emoji && <span className="mr-0.5">{subcat.emoji}</span>}
              {subcat.name}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    );
  } else if (field === "from_account" || field === "to_account") {
    return (
      <MultiSelect
        value={(modelValue as string[] | undefined) || []}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
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
  }

  return null;
};

ActivityFilterValueMenu.displayName = "ActivityFilterValueMenu";
