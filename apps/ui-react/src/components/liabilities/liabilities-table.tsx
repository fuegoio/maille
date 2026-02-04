import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { searchStore } from "@/stores/search";
import { LiabilityLine } from "./liability-line";
import { LiabilitiesFilters } from "./filters/liabilities-filters";
import type { UUID } from "crypto";
import type { Liability } from "@maille/core/liabilities";
import { verifyLiabilityFilter } from "@maille/core/liabilities";
import { Calendar } from "lucide-react";

interface LiabilitiesTableProps {
  liabilities: Liability[];
  viewId: string;
  grouping?: "period" | null;
  accountFilter?: UUID | null;
  className?: string;
}

export function LiabilitiesTable({
  liabilities,
  viewId,
  grouping = null,
  accountFilter = null,
  className,
}: LiabilitiesTableProps) {
  const liabilityView = useStore(viewsStore, (state) => state.getLiabilityView(viewId));
  const filterStringBySearch = useStore(searchStore, (state) => state.filterStringBySearch);

  const liabilitiesFiltered = React.useMemo(() => {
    return liabilities
      .filter((liability) => filterStringBySearch(liability.name))
      .filter((liability) => (accountFilter !== null ? liability.account === accountFilter : true))
      .filter((liability) => {
        if (liabilityView.filters.length === 0) return true;

        return liabilityView.filters
          .map((filter) => {
            return verifyLiabilityFilter(filter, liability);
          })
          .every((f) => f);
      });
  }, [liabilities, filterStringBySearch, accountFilter, liabilityView.filters]);

  const liabilitiesSorted = React.useMemo(() => {
    return [...liabilitiesFiltered].sort((a, b) => {
      // Sort by liability date (descending), then by liability ID (descending)
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [liabilitiesFiltered]);

  type Group = {
    id: string;
    month: number;
    year: number;
    liabilities: Liability[];
  };

  type LiabilityAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "liability" } & Liability);

  const liabilitiesWithGroups = React.useMemo<LiabilityAndGroup[]>(() => {
    if (!grouping) return liabilitiesSorted.map((l) => ({ itemType: "liability", ...l }));

    const groups = liabilitiesSorted.reduce((groups, l) => {
      const group = groups.find(
        (p) => p.month === l.date.getMonth() && p.year === l.date.getFullYear(),
      );

      if (group) {
        group.liabilities.push(l);
      } else {
        groups.push({
          id: `${l.date.getMonth() + 1}-${l.date.getFullYear()}`,
          month: l.date.getMonth(),
          year: l.date.getFullYear(),
          liabilities: [l],
        });
      }

      return groups;
    }, [] as Group[]);

    // Sort groups by year (descending) and month (descending)
    groups.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return groups.reduce((lwg, group) => {
      lwg.push({
        itemType: "group" as const,
        id: group.id,
        month: group.month,
        year: group.year,
        liabilities: group.liabilities,
      });
      return lwg.concat(group.liabilities.map((l) => ({ itemType: "liability" as const, ...l })));
    }, [] as LiabilityAndGroup[]);
  }, [liabilitiesSorted, grouping]);

  const periodFormatter = (month: number, year: number): string => {
    return new Date(year, month).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={`flex h-full flex-1 overflow-x-hidden ${className || ""}`}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <LiabilitiesFilters viewId={viewId} liabilities={liabilitiesFiltered} />
        <div className="flex flex-1 flex-col overflow-x-hidden sm:min-w-[575px]">
          {liabilitiesFiltered.length === 0 ? (
            <div className="flex flex-1 items-center justify-center overflow-hidden">
              <div className="text-primary-700">No liability found</div>
            </div>
          ) : (
            <div className="overflow-y-auto pb-40">
              {grouping
                ? liabilitiesWithGroups.map((item) =>
                    item.itemType === "group" ? (
                      <div
                        key={item.id}
                        className="bg-primary-800 flex h-10 flex-shrink-0 items-center gap-2 border-b pl-5 sm:pl-7"
                      >
                        <Calendar className="text-primary-100 h-4 w-4" />
                        <div className="text-sm font-medium">
                          {periodFormatter(item.month, item.year)}
                        </div>
                        <div className="flex-1" />
                      </div>
                    ) : (
                      <LiabilityLine key={item.id} liability={item} />
                    ),
                  )
                : liabilitiesSorted.map((liability) => (
                    <LiabilityLine key={liability.id} liability={liability} />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
