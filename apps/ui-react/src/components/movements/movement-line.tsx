import type { Movement } from "@maille/core/movements";
import { CircleCheck, CircleDotDashed } from "lucide-react";

import { AccountLabel } from "@/components/accounts/account-label";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrencyFormatter } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MovementLineProps {
  movement: Movement;
  selected: boolean;
  checked: boolean;
  onClick: () => void;
  onCheckedChange: (checked: boolean) => void;
}

export function MovementLine({
  movement,
  selected,
  checked,
  onClick,
  onCheckedChange,
}: MovementLineProps) {
  const currencyFormatter = getCurrencyFormatter();

  return (
    <div
      key={movement.id}
      className={cn(
        "group flex h-10 shrink-0 items-center gap-2 overflow-hidden border-b pr-2 text-sm transition-colors hover:bg-accent lg:pr-6",
        {
          "border-l-4 border-l-primary bg-accent pl-4.5": selected,
          "pl-5.5": !selected,
          "bg-primary/30 hover:bg-primary/40": checked,
        },
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) =>
          checked != "indeterminate" && onCheckedChange(checked)
        }
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "opacity-0 transition-opacity group-hover:opacity-100",
          checked && "opacity-100",
        )}
      />

      <div className="mr-1 ml-3 hidden w-18 shrink-0 text-muted-foreground lg:block">
        {movement.date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "2-digit",
          day: "2-digit",
        })}
      </div>
      <div className="w-10 shrink-0 text-muted-foreground lg:hidden">
        {movement.date.toLocaleDateString(undefined, {
          month: "2-digit",
          day: "2-digit",
        })}
      </div>

      {movement.status === "incomplete" ? (
        <CircleDotDashed className=" size-4 text-orange-300" />
      ) : (
        <CircleCheck className="size-4 text-indigo-300" />
      )}

      <div className="text-primary-100 ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {movement.name}
      </div>

      <div className="flex-1" />
      <div className="mr-3 rounded-full border px-2 py-1">
        <AccountLabel accountId={movement.account} />
      </div>
      <div className="text-right font-mono whitespace-nowrap text-white">
        {currencyFormatter.format(movement.amount)}
      </div>
    </div>
  );
}
