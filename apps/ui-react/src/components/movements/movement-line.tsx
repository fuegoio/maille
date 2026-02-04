import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
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
  onClick 
}: MovementLineProps) {
  const { focusedMovement } = useStore(movementsStore, (state) => ({
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
        "h-10 flex items-center gap-2 pr-2 sm:pr-6 border-b text-sm flex-shrink-0 transition-colors hover:bg-primary-800/50 pl-4 sm:pl-2",
        focusedMovement === movement.id && 
          "bg-primary-800/50 border-l-4 border-l-primary-400 pl-3 sm:pl-1",
        isMovementSelected && "bg-primary-800/70"
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={isMovementSelected}
        className={cn(
          "size-3.5 hover:opacity-100 transition-opacity hidden sm:block",
          isMovementSelected ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMovement();
        }}
      />
      <div className="hidden sm:block text-primary-100 w-20 shrink-0">
        {movement.date.toLocaleDateString('fr-FR')}
      </div>
      <div className="sm:hidden text-primary-100 w-10 shrink-0">
        {movement.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
      </div>

      {movement.status === 'incomplete' ? (
        <i className="mdi mdi-progress-helper text-lg text-orange-300" aria-hidden="true" />
      ) : (
        <i className="mdi mdi-check-circle-outline text-lg text-emerald-300" aria-hidden="true" />
      )}
      <AccountLabel accountId={movement.account} />

      <div className="ml-1 text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap">
        {movement.name}
      </div>

      <div className="flex-1" />
      <div className="text-white text-right whitespace-nowrap font-mono">
        {currencyFormatter.format(movement.amount)}
      </div>
    </div>
  );
}