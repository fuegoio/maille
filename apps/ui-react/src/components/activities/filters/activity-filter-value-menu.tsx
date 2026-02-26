import {
  ActivityFilterDateValues,
  ActivityType,
} from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { AccountSelect } from "@/components/accounts/account-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        value={modelValue as number | undefined}
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
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
      >
        <SelectTrigger ref={selectRef} className={inputClassName} noChevron>
          <SelectValue placeholder="Type value" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(ActivityType).map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
