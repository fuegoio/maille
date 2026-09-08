import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCounterparties } from "@/stores/counterparties";

interface CounterpartiesSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  accountId: string;
  className?: string;
  size?: "sm" | "default";
  placeholder?: string;
}

export function CounterpartiesSelect({
  accountId,
  value,
  onValueChange,
  className,
  size = "default",
  placeholder = "Select a counterparty",
}: CounterpartiesSelectProps) {
  const counterparties = useCounterparties((state) => state.counterparties);
  const accountCounterparties = counterparties.filter(
    (c) => c.account === accountId,
  );

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger size={size} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Counterparties</SelectLabel>
          {accountCounterparties.map((counterparty) => (
            <SelectItem key={counterparty.id} value={counterparty.id}>
              {counterparty.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
