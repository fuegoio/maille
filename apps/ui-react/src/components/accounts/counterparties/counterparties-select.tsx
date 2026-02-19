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
}

export function CounterpartiesSelect({
  accountId,
  value,
  onValueChange,
  className,
}: CounterpartiesSelectProps) {
  const counterparties = useCounterparties((state) => state.counterparties);
  const accountCounterparties = counterparties.filter(
    (c) => c.account === accountId,
  );

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder="Select a counterparty" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Counterparties</SelectLabel>
          {accountCounterparties.map((counterparty) => (
            <SelectItem value={counterparty.id}>{counterparty.name}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
