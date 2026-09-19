import type { LucideIcon } from "lucide-react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  Minus,
} from "lucide-react";

import type {
  GroupIcon,
  GroupMarker as GroupMarkerData,
} from "@/lib/view-grouping";

import {
  AccountIcon,
  ActivityIcon,
  CategoryIcon,
  FundIcon,
  MixedFundsIcon,
  ProjectIcon,
  SubcategoryIcon,
  UntrackedIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR } from "@/stores/accounts";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";

const icons = {
  category: CategoryIcon,
  subcategory: SubcategoryIcon,
  project: ProjectIcon,
  activity: ActivityIcon,
  account: AccountIcon,
  fund: FundIcon,
  untracked: UntrackedIcon,
  "mixed-funds": MixedFundsIcon,
} satisfies Record<GroupIcon, LucideIcon>;

/** The same identity marks as ledger rows, kept separate from the readable group name. */
export function GroupMarker({ marker }: { marker: GroupMarkerData }) {
  const content = () => {
    switch (marker.kind) {
      case "emoji":
        return <span className="text-sm leading-none">{marker.value}</span>;
      case "account":
        return (
          <span
            className={cn(
              "size-3 rounded-full",
              ACCOUNT_TYPES_COLOR[marker.type],
            )}
          />
        );
      case "fund":
        return (
          <span
            className="size-2.5 rounded-sm ring-1 ring-foreground/10"
            style={{ backgroundColor: marker.color }}
          />
        );
      case "status":
        return marker.value === "completed" ? (
          <CircleCheck className="size-3.5 text-primary" />
        ) : marker.value === "incomplete" ? (
          <CircleDotDashed className="size-3.5 text-warning" />
        ) : (
          <CircleDashed className="size-3.5" />
        );
      case "direction":
        return marker.value === "in" ? (
          <ArrowDownLeft className="size-3.5 text-activity-revenue" />
        ) : marker.value === "out" ? (
          <ArrowUpRight className="size-3.5 text-activity-expense" />
        ) : (
          <Minus className="size-3.5" />
        );
      case "types":
        return marker.values.length > 0 ? (
          <span className="flex items-center gap-1">
            {marker.values.map((type) => (
              <span
                key={type}
                className={cn(
                  "size-2 rounded-full",
                  ACTIVITY_TYPES_COLOR[type],
                )}
              />
            ))}
          </span>
        ) : (
          <CircleDashed className="size-3.5" />
        );
      case "icon": {
        const Icon = icons[marker.name];
        return <Icon className="size-3.5" />;
      }
    }
  };
  return (
    <span
      aria-hidden="true"
      data-slot="group-marker"
      data-kind={marker.kind}
      className="flex min-w-3.5 shrink-0 items-center justify-center text-muted-foreground"
    >
      {content()}
    </span>
  );
}
