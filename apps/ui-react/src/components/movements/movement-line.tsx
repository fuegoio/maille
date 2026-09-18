import type { Movement } from "@maille/core/movements";

import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { CircleCheck, CircleDotDashed } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { ledgerRowClassName } from "@/components/shared/ledger-table";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WORKFLOW_STATUS_CONFIG } from "@/components/workflows/workflow-status";
import { cn } from "@/lib/utils";
import { useWorkflows } from "@/stores/workflows";

interface MovementLineProps {
  movement: Movement;
  checked: boolean;
  /** Outline sides when the row is checked or focused; absent otherwise. */
  outlineSides?: { top: boolean; bottom: boolean };
  /** Hide the checkbox in summary contexts; selection stays a table-only concern. */
  showCheckbox?: boolean;
  onCheckedChange: (event?: React.MouseEvent) => void;
}

export function MovementLine({
  movement,
  checked,
  outlineSides,
  showCheckbox = true,
  onCheckedChange,
}: MovementLineProps) {
  const workflow = useWorkflows((state) =>
    state.getWorkflowByMovement(movement.id),
  );

  const router = useRouter();

  return (
    <ContextLink
      key={movement.id}
      to="/movements/$id"
      params={{ id: movement.id }}
      className={cn(
        ledgerRowClassName,
        "group flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-5.5 text-sm lg:pr-6",
        outlineSides && rowOutlineClasses(outlineSides),
      )}
    >
      {showCheckbox && (
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) =>
            checked != "indeterminate" && onCheckedChange()
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCheckedChange(e);
          }}
          className={cn(
            "mr-1 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex",
            checked && "opacity-100",
          )}
        />
      )}

      <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
        {format(movement.date, "dd EEE")}
      </div>
      <div className="ml-2 w-8 shrink-0 text-muted-foreground lg:hidden">
        {format(movement.date, "dd EEEEE")}
      </div>

      {movement.status === "incomplete" ? (
        <CircleDotDashed className="size-4 shrink-0 text-warning" />
      ) : (
        <CircleCheck className="size-4 shrink-0 text-primary" />
      )}

      <Badge
        variant="outline"
        className="h-6 shrink-0 hover:bg-border/50 sm:mr-1"
        onClick={(e) => {
          e.preventDefault();
          void router.navigate({
            to: `/accounts/$id`,
            params: { id: movement.account },
          });
        }}
      >
        <AccountLabel accountId={movement.account} />
      </Badge>

      <div className="overflow-hidden font-medium text-ellipsis whitespace-nowrap text-foreground">
        {movement.name}
      </div>

      <div className="flex-1" />

      {(workflow?.status === "running" || workflow?.status === "pending") && (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full sm:mr-1",
            WORKFLOW_STATUS_CONFIG[workflow.status].dotClass,
            workflow.status === "running" && "animate-pulse",
          )}
        />
      )}

      <AmountPairsValue
        pairs={[
          {
            dot: movement.amount > 0 ? "bg-green-400" : "bg-red-400",
            amount: movement.amount,
          },
        ]}
        hideZeros={false}
      />
    </ContextLink>
  );
}
