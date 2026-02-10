import * as React from "react";
import { useMovements } from "@/stores/movements";
import { Checkbox } from "@/components/ui/checkbox";
import { AccountLabel } from "@/components/accounts/account-label";
import { getCurrencyFormatter } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLongPress } from "use-long-press";
import type { Movement } from "@maille/core/movements";

interface MovementLineProps {
  movement: Movement;
  isMovementSelected: boolean;
  onSelectMovement: () => void;
  onClick: () => void;
}

export function MovementLine({
  movement,
  isMovementSelected,
  onSelectMovement,
  onClick,
}: MovementLineProps) {
  const { focusedMovement } = useMovements((state) => ({
    focusedMovement: state.focusedMovement,
  }));

  const currencyFormatter = getCurrencyFormatter();

  const handleLongPress = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    onSelectMovement();
  };

  const longPressBind = useLongPress(handleLongPress, {
    threshold: 500,
    cancelOnMovement: true,
  });

  return (
    <div
      key={movement.id}
      {...longPressBind()}
      className={cn(
        "hover:bg-primary-800/50 flex h-10 flex-shrink-0 items-center gap-2 border-b pr-2 pl-4 text-sm transition-colors sm:pr-6 sm:pl-2",
        focusedMovement === movement.id &&
          "bg-primary-800/50 border-l-primary-400 border-l-4 pl-3 sm:pl-1",
        isMovementSelected && "bg-primary-800/70",
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={isMovementSelected}
        className={cn(
          "hidden size-3.5 transition-opacity hover:opacity-100 sm:block",
          isMovementSelected ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMovement();
        }}
      />
      <div className="text-primary-100 hidden w-20 shrink-0 sm:block">
        {movement.date.toLocaleDateString("fr-FR")}
      </div>
      <div className="text-primary-100 w-10 shrink-0 sm:hidden">
        {movement.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
      </div>

      {movement.status === "incomplete" ? (
        <i className="mdi mdi-progress-helper text-lg text-orange-300" aria-hidden="true" />
      ) : (
        <i className="mdi mdi-check-circle-outline text-lg text-emerald-300" aria-hidden="true" />
      )}
      <AccountLabel accountId={movement.account} />

      <div className="text-primary-100 ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {movement.name}
      </div>

      <div className="flex-1" />
      <div className="text-right font-mono whitespace-nowrap text-white">
        {currencyFormatter.format(movement.amount)}
      </div>
    </div>
  );
}
