import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFunds } from "@/stores/funds";

interface FundSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  size?: "sm" | "default";
}

export function FundSelect({
  value,
  onValueChange,
  placeholder = "Select a fund",
  allowEmpty = false,
  emptyLabel = "No fund",
  className,
  size = "default",
}: FundSelectProps) {
  const funds = useFunds((state) => state.funds);

  const allFunds = [
    ...(allowEmpty ? [{ id: "clear", name: emptyLabel, emoji: null }] : []),
    ...funds,
  ];

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(newValue) => {
        onValueChange(newValue === "clear" ? null : newValue);
      }}
    >
      <SelectTrigger size={size} className={cn("w-full min-w-0", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allFunds.map((fund) => (
          <SelectItem key={fund.id} value={fund.id}>
            <div className="flex min-w-0 items-center">
              {fund.emoji && <span className="w-6 shrink-0">{fund.emoji}</span>}
              <span className="truncate">{fund.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
