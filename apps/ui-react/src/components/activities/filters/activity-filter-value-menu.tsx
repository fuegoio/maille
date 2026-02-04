import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActivityFilterDateValues, ActivityType } from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounts/account-select";

interface ActivityFilterValueMenuProps {
  modelValue: ActivityFilter["value"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["value"]) => void;
  onClose: () => void;
}

export const ActivityFilterValueMenu = forwardRef<
  { click: () => void },
  ActivityFilterValueMenuProps
>(({ modelValue, field, onUpdateModelValue, onClose }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const [textValue, setTextValue] = useState<string | undefined>(modelValue as string | undefined);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    click: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else if (selectRef.current) {
        selectRef.current.click();
      }
    },
  }));

  if (field === "date") {
    return (
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <SelectTrigger
          ref={selectRef}
          className={`text-primary-100 hover:bg-primary-700 flex h-7 min-w-[24px] items-center border-r px-2 text-sm transition-colors hover:text-white ${
            open ? "bg-primary-700 text-white" : ""
          }`}
        >
          <SelectValue placeholder="Date value" />
          <ChevronDown className="ml-1 size-4" />
        </SelectTrigger>
        <SelectContent className="bg-primary-800 border-primary-600">
          {ActivityFilterDateValues.map((value) => (
            <SelectItem key={value} value={value} className="text-primary-100 hover:bg-primary-700">
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
        onChange={(e) => {
          const value = e.target.value;
          onUpdateModelValue(value === "" ? undefined : parseFloat(value));
        }}
        onBlur={() => onClose()}
        className="hover:bg-primary-700 text-primary-100 h-7 border-r border-none bg-transparent px-2 text-sm hover:text-white focus:ring-0"
      />
    );
  } else if (field === "name" || field === "description") {
    return (
      <Input
        ref={inputRef}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onUpdateModelValue(textValue);
          }
        }}
        onBlur={() => {
          onUpdateModelValue(textValue);
          onClose();
        }}
        className="hover:bg-primary-700 text-primary-100 h-7 min-w-0 border-none bg-transparent px-2 text-sm hover:text-white focus:ring-0"
      />
    );
  } else if (field === "type") {
    return (
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as ActivityFilter["value"]);
        }}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <SelectTrigger
          ref={selectRef}
          className={`text-primary-100 hover:bg-primary-700 flex h-7 min-w-[24px] items-center border-r px-2 text-sm transition-colors hover:text-white ${
            open ? "bg-primary-700 text-white" : ""
          }`}
        >
          <SelectValue placeholder="Type value" />
          <ChevronDown className="ml-1 size-4" />
        </SelectTrigger>
        <SelectContent className="bg-primary-800 border-primary-600">
          {Object.values(ActivityType).map((value) => (
            <SelectItem key={value} value={value} className="text-primary-100 hover:bg-primary-700">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (field === "from_account" || field === "to_account") {
    return (
      <AccountSelect
        modelValue={modelValue && Array.isArray(modelValue) ? modelValue : []}
        onUpdateModelValue={(value) => {
          onUpdateModelValue(value);
        }}
        multiple
        borderless
        className="hover:bg-primary-700 border-r"
      />
    );
  }

  return null;
});

ActivityFilterValueMenu.displayName = "ActivityFilterValueMenu";
