import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActivityFilterDateValues } from "@maille/core/activities";
import type { MovementFilter } from "@maille/core/movements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounts/account-select";

interface MovementFilterValueMenuProps {
  modelValue: MovementFilter["value"] | undefined;
  field: MovementFilter["field"];
  onUpdateModelValue: (value: MovementFilter["value"]) => void;
  onClose: () => void;
}

export const MovementFilterValueMenu = forwardRef<
  { click: () => void },
  MovementFilterValueMenuProps
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
          onUpdateModelValue(value as MovementFilter["value"]);
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
          className={`flex items-center px-2 text-sm h-7 text-primary-100 hover:text-white hover:bg-primary-700 transition-colors border-r min-w-[24px] ${
            open ? "bg-primary-700 text-white" : ""
          }`}
        >
          <SelectValue placeholder="Date value" />
          <ChevronDown className="size-4 ml-1" />
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
        className="text-sm px-2 border-r h-7 hover:bg-primary-700 text-primary-100 hover:text-white bg-transparent border-none focus:ring-0"
      />
    );
  } else if (field === "name") {
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
        className="border-none min-w-0 bg-transparent hover:bg-primary-700 text-sm px-2 h-7 text-primary-100 hover:text-white focus:ring-0"
      />
    );
  } else if (field === "account") {
    return (
      <AccountSelect
        modelValue={modelValue && Array.isArray(modelValue) ? modelValue : []}
        onUpdateModelValue={(value) => {
          onUpdateModelValue(value);
        }}
        multiple
        borderless
        className="border-r hover:bg-primary-700"
      />
    );
  } else if (field === "status") {
    return (
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as MovementFilter["value"]);
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
          className={`flex items-center px-2 text-sm h-7 text-primary-100 hover:text-white hover:bg-primary-700 transition-colors border-r min-w-[24px] ${
            open ? "bg-primary-700 text-white" : ""
          }`}
        >
          <SelectValue placeholder="Status value" />
          <ChevronDown className="size-4 ml-1" />
        </SelectTrigger>
        <SelectContent className="bg-primary-800 border-primary-600">
          {["incomplete", "completed"].map((value) => (
            <SelectItem key={value} value={value} className="text-primary-100 hover:bg-primary-700">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return null;
});

MovementFilterValueMenu.displayName = "MovementFilterValueMenu";
