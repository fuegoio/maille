import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFunds } from "@/stores/funds";

interface FundSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function FundSelect({
  value,
  onValueChange,
  placeholder = "Select a fund",
  allowEmpty = false,
  emptyLabel = "No fund",
}: FundSelectProps) {
  const funds = useFunds((state) => state.funds);

  const allFunds = [
    ...(allowEmpty ? [{ id: "clear", name: emptyLabel, emoji: null }] : []),
    ...funds,
  ];

  return (
    <Select
      value={value || (allowEmpty ? "clear" : "")}
      onValueChange={(newValue) => {
        onValueChange(newValue === "clear" ? null : newValue);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allFunds.map((fund) => (
          <SelectItem key={fund.id} value={fund.id}>
            <div className="flex items-center">
              {fund.emoji && <span className="w-6">{fund.emoji}</span>}
              <span>{fund.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
