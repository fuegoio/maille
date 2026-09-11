import { AccountType } from "@maille/core/accounts";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { CounterpartyLine } from "@/components/counterparties/counterparty-line";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { useAccounts, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";
import { useCounterparties } from "@/stores/counterparties";
import { useViewSearch } from "@/stores/search";

interface CounterpartiesTableProps {
  grouping?: "account" | null;
}

export function CounterpartiesTable({
  grouping = "account",
}: CounterpartiesTableProps) {
  const counterparties = useCounterparties((state) => state.counterparties);
  const accounts = useAccounts((state) => state.accounts);
  const { search } = useViewSearch();
  const scrollRef = useScrollRestoration<HTMLDivElement>("counterparties");
  const [groupsFolded, setGroupsFolded] = useState<string[]>([]);

  const liabilityAccounts = useMemo(
    () => accounts.filter((a) => a.type === AccountType.LIABILITIES),
    [accounts],
  );

  const counterpartiesFiltered = useMemo(() => {
    return counterparties.filter((c) => searchCompare(search, c.name));
  }, [counterparties, search]);

  type Group = {
    id: string;
    account: string;
    counterparties: typeof counterpartiesFiltered;
  };

  type CounterpartyAndGroup =
    | ({ itemType: "group" } & Group)
    | ({
        itemType: "counterparty";
        id: string;
      } & (typeof counterpartiesFiltered)[number]);

  const counterpartiesWithGroups = useMemo<CounterpartyAndGroup[]>(() => {
    if (!grouping)
      return counterpartiesFiltered.map((c) => ({
        itemType: "counterparty" as const,
        ...c,
      }));

    const groups = liabilityAccounts.reduce((acc: Group[], account) => {
      const accountCounterparties = counterpartiesFiltered.filter(
        (c) => c.account === account.id,
      );
      if (accountCounterparties.length > 0) {
        acc.push({
          id: account.id,
          account: account.id,
          counterparties: accountCounterparties,
        });
      }
      return acc;
    }, []);

    return groups.reduce((cwg: CounterpartyAndGroup[], group) => {
      cwg.push({
        itemType: "group",
        id: group.id,
        account: group.account,
        counterparties: group.counterparties,
      });
      if (!groupsFolded.includes(group.id)) {
        return cwg.concat(
          group.counterparties.map((c) => ({
            itemType: "counterparty" as const,
            ...c,
          })),
        );
      }
      return cwg;
    }, []);
  }, [counterpartiesFiltered, liabilityAccounts, grouping, groupsFolded]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto">
        {counterpartiesFiltered.length !== 0 ? (
          <ScrollArea className="flex-1" viewportRef={scrollRef}>
            {grouping
              ? counterpartiesWithGroups.map((item) => (
                  <div key={item.id}>
                    {item.itemType === "group" ? (
                      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 pr-2 pl-5 sm:px-6">
                        <ChevronDown
                          className={cn(
                            "mr-2 size-3 opacity-20 transition-all hover:opacity-100 sm:mr-3",
                            groupsFolded.includes(item.id) &&
                              "-rotate-90 opacity-100",
                          )}
                          onClick={() => {
                            if (groupsFolded.includes(item.id)) {
                              setGroupsFolded((prev) =>
                                prev.filter((id) => id !== item.id),
                              );
                            } else {
                              setGroupsFolded((prev) => [...prev, item.id]);
                            }
                          }}
                        />
                        <div
                          className={cn(
                            "size-3 shrink-0 rounded-xl",
                            ACCOUNT_TYPES_COLOR[AccountType.LIABILITIES],
                          )}
                        />
                        <div className="text-sm font-medium">
                          <AccountLabel accountId={item.account} />
                        </div>
                      </div>
                    ) : (
                      <CounterpartyLine counterparty={item} />
                    )}
                  </div>
                ))
              : counterpartiesFiltered.map((counterparty) => (
                  <CounterpartyLine
                    key={counterparty.id}
                    counterparty={counterparty}
                  />
                ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div className="text-sm text-muted-foreground">
              No counterparty found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
