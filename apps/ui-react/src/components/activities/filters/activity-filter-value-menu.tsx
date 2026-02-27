import {
  ActivityFilterDateValues,
  ActivityType,
} from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { AccountSelect } from "@/components/accounts/account-select";
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
import { ACTIVITY_TYPES_COLOR, ACTIVITY_TYPES_NAME } from "@/stores/activities";

interface ActivityFilterValueMenuProps {
  modelValue: ActivityFilter["value"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["value"]) => void;
}

export const ActivityFilterValueMenu = forwardRef<
  { click: () => void },
  ActivityFilterValueMenuProps
>(({ modelValue, field, onUpdateModelValue }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const [textValue, setTextValue] = useState<string | undefined>(
    modelValue as string | undefined,
  );

  useImperativeHandle(ref, () => ({
    click: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else if (selectRef.current) {
        selectRef.current.click();
      }
    },
  }));

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
        <SelectTrigger ref={selectRef} className={inputClassName} noChevron>
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
        ref={inputRef}
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
        ref={inputRef}
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
        <MultiSelectTrigger ref={selectRef} className={inputClassName}>
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
        <MultiSelectContent>
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
  } else if (field === "from_account" || field === "to_account") {
    return (
      <AccountSelect
        value={modelValue && Array.isArray(modelValue) ? modelValue : []}
        onChange={(value) => {
          onUpdateModelValue(value);
        }}
      />
    );
  }

  return null;
});

ActivityFilterValueMenu.displayName = "ActivityFilterValueMenu";
