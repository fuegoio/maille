import type { TransactionFilter } from "@maille/core/views";

import { TransactionFilterDateValues } from "@maille/core/views";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionFilterValueMenuProps {
  modelValue: TransactionFilter["value"] | undefined;
  field: TransactionFilter["field"];
  onUpdateModelValue: (value: TransactionFilter["value"]) => void;
}

const inputClassName =
  "rounded-none border text-xs! focus-visible:border-input focus-visible:ring-0";

export const TransactionFilterValueMenu = ({
  modelValue,
  field,
  onUpdateModelValue,
}: TransactionFilterValueMenuProps) => {
  if (field === "date") {
    return (
      <Select
        value={modelValue as string | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as TransactionFilter["value"]);
        }}
      >
        <SelectTrigger className={inputClassName}>
          <SelectValue placeholder="Date value" />
        </SelectTrigger>
        <SelectContent>
          {TransactionFilterDateValues.map((value) => (
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
        value={(modelValue as number | undefined) ?? ""}
        className={inputClassName}
        onChange={(e) => {
          const value = e.target.value;
          onUpdateModelValue(
            value === "" ? undefined : parseFloat(value),
          ) as never;
        }}
      />
    );
  } else if (field === "direction") {
    return (
      <Select
        value={modelValue as "in" | "out" | undefined}
        onValueChange={(value) => {
          onUpdateModelValue(value as TransactionFilter["value"]);
        }}
      >
        <SelectTrigger className={inputClassName}>
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="in">In</SelectItem>
          <SelectItem value="out">Out</SelectItem>
        </SelectContent>
      </Select>
    );
  } else if (field === "status") {
    return (
      <Select
        value={((modelValue as string[] | undefined) ?? [])[0]}
        onValueChange={(value) => {
          onUpdateModelValue([value] as TransactionFilter["value"]);
        }}
      >
        <SelectTrigger className={inputClassName}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="incomplete">Incomplete</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return null;
};

TransactionFilterValueMenu.displayName = "TransactionFilterValueMenu";
