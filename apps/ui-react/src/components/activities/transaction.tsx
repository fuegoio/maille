import type { Transaction } from "@maille/core/activities";
import type { FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { motion, useReducedMotion } from "framer-motion";
import { Ellipsis, MoveDown, MoveRight, TrashIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { AccountSelect } from "@/components/accounts/account-select";
import { FundSelect } from "@/components/funds/fund-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useFunds } from "@/stores/funds";

import { AssetSelect } from "../accounts/assets/assets-select";
import { CounterpartiesSelect } from "../accounts/counterparties/counterparties-select";

/** A side's metadata: a quiet label naming the select next to it. */
function MetadataChip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

interface TransactionProps {
  transaction: Omit<Transaction, "id">;
  className?: string;
  isStaged?: boolean;
  /** Whether this transaction is the one linked from the current URL. */
  isFocused?: boolean;
  /** "card" renders a boxed row (dialogs); "flat" a surface row (pages). */
  variant?: "card" | "flat";
  /** Hide the fund / counterparty / asset chips for a simpler layout. */
  showMetadata?: boolean;
  onUpdate?: (
    updateData: Partial<Transaction> & { fundMoves?: FundMove[] },
  ) => void;
  onDelete?: () => void;
}

export function Transaction({
  transaction,
  className,
  isStaged,
  isFocused,
  variant = "card",
  showMetadata = true,
  onUpdate,
  onDelete,
}: TransactionProps) {
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // A focused transaction arrives via a deep link: bring it into view so
  // the highlight lands where the user is already looking
  useEffect(() => {
    if (!isFocused) return;
    rootRef.current?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [isFocused, prefersReducedMotion]);

  const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
  const toAccount = accounts.find((a) => a.id === transaction.toAccount);

  // The funds this transaction draws from / feeds into, derived from its legs
  const fromFundMove = transaction.fundMoves?.find((m) => m.fromFund);
  const toFundMove = transaction.fundMoves?.find((m) => m.toFund);
  const trackedFromFund = fromFundMove
    ? funds.find((f) => f.id === fromFundMove.fromFund)
    : undefined;
  const trackedToFund = toFundMove
    ? funds.find((f) => f.id === toFundMove.toFund)
    : undefined;

  // Money can carry a fund label while it sits in a balance account:
  // the from side tracks the fund it leaves, the to side the fund it
  // receives (e.g. an investment purchase can leave "Savings" and enter
  // "Investments")
  const isFromBalance =
    fromAccount &&
    ![AccountType.EXPENSE, AccountType.REVENUE].includes(fromAccount.type);
  const isToBalance =
    toAccount &&
    ![AccountType.EXPENSE, AccountType.REVENUE].includes(toAccount.type);

  const handleFundChange = (side: "from" | "to", fundId: string | null) => {
    const fromFund = side === "from" ? fundId : (trackedFromFund?.id ?? null);
    const toFund = side === "to" ? fundId : (trackedToFund?.id ?? null);
    // The same fund pinned on both sides of a transfer is a meaningful pin:
    // the money keeps its purpose while moving between accounts.
    onUpdate?.({
      fundMoves:
        fromFund !== null || toFund !== null
          ? [
              {
                id: crypto.randomUUID(),
                fromFund,
                toFund,
                amount: transaction.amount,
                note: null,
                date: new Date(),
                transaction: null,
              },
            ]
          : [],
    });
  };

  // Metadata rows are shared across sides so they stay aligned: a side
  // renders its own chip in each row, or keeps the row's height empty.
  // Each side's rule sits at its account swatch's center: 1px trigger
  // border + 10px trigger padding + half the size-3 swatch = 17px.
  const fromNeedsSub =
    fromAccount?.type === AccountType.LIABILITIES ||
    fromAccount?.type === AccountType.ASSETS;
  const toNeedsSub =
    toAccount?.type === AccountType.LIABILITIES ||
    toAccount?.type === AccountType.ASSETS;
  const subRowExists = fromNeedsSub || toNeedsSub;
  const fundRowExists = Boolean(isFromBalance) || Boolean(isToBalance);
  const fromHasChips = showMetadata && (fromNeedsSub || Boolean(isFromBalance));
  const toHasChips = showMetadata && (toNeedsSub || Boolean(isToBalance));

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={rootRef}
          className={cn(
            "@container relative text-sm",
            variant === "card" && "rounded-lg border bg-muted/30 p-3 shadow-md",
            variant === "flat" && "rounded-lg border bg-muted/30 p-3",
            isStaged && variant === "card" && "border-dashed opacity-70",
            isStaged && variant === "flat" && "border-dashed",
            isFocused && "border-primary",
            className,
          )}
        >
          <div className="grid grid-cols-1 gap-2 @lg:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_auto] @lg:items-start @lg:gap-x-3">
            {/* From side: its account, and its metadata grouped under it */}
            <div className="flex min-w-0 flex-col gap-2">
              <AccountSelect
                className="w-full min-w-0"
                value={transaction.fromAccount}
                onChange={(account) =>
                  onUpdate?.({
                    fromAccount: account,
                    fromCounterparty: null,
                    fromAsset: null,
                  })
                }
              />
              {fromHasChips && (
                <div className="ml-[17px] flex flex-col gap-1.5 border-l pl-3">
                  {subRowExists &&
                    (fromAccount?.type === AccountType.LIABILITIES ? (
                      <MetadataChip label="Counterparty">
                        <CounterpartiesSelect
                          size="sm"
                          className="w-fit text-xs"
                          accountId={transaction.fromAccount}
                          value={transaction.fromCounterparty || ""}
                          onValueChange={(counterparty) =>
                            onUpdate?.({
                              fromCounterparty: counterparty,
                            })
                          }
                          placeholder="None"
                        />
                      </MetadataChip>
                    ) : fromAccount?.type === AccountType.ASSETS ? (
                      <MetadataChip label="Asset">
                        <AssetSelect
                          size="sm"
                          className="w-fit text-xs"
                          accountId={transaction.fromAccount}
                          value={transaction.fromAsset || ""}
                          onValueChange={(asset) =>
                            onUpdate?.({
                              fromAsset: asset,
                            })
                          }
                          placeholder="None"
                        />
                      </MetadataChip>
                    ) : (
                      <div className="h-7" aria-hidden="true" />
                    ))}
                  {fundRowExists &&
                    (isFromBalance ? (
                      <MetadataChip label="Fund">
                        <FundSelect
                          size="sm"
                          className="w-fit text-xs"
                          value={trackedFromFund?.id ?? null}
                          onValueChange={(fundId) =>
                            handleFundChange("from", fundId)
                          }
                          placeholder="Untracked"
                          allowEmpty
                          emptyLabel="Untracked"
                        />
                      </MetadataChip>
                    ) : (
                      <div className="h-7" aria-hidden="true" />
                    ))}
                </div>
              )}
            </div>

            <div className="hidden h-8 items-center justify-center @lg:flex">
              <MoveRight className="size-4 text-muted-foreground" />
            </div>
            <div className="flex justify-center @lg:hidden">
              <MoveDown className="size-4 text-muted-foreground" />
            </div>

            {/* To side: its account, and its metadata grouped under it */}
            <div className="flex min-w-0 flex-col gap-2">
              <AccountSelect
                className="w-full min-w-0"
                value={transaction.toAccount}
                onChange={(account) =>
                  onUpdate?.({
                    toAccount: account,
                    toCounterparty: null,
                    toAsset: null,
                  })
                }
              />
              {toHasChips && (
                <div className="ml-[17px] flex flex-col gap-1.5 border-l pl-3">
                  {subRowExists &&
                    (toAccount?.type === AccountType.LIABILITIES ? (
                      <MetadataChip label="Counterparty">
                        <CounterpartiesSelect
                          size="sm"
                          className="w-fit text-xs"
                          accountId={transaction.toAccount}
                          value={transaction.toCounterparty || ""}
                          onValueChange={(counterparty) =>
                            onUpdate?.({
                              toCounterparty: counterparty,
                            })
                          }
                          placeholder="None"
                        />
                      </MetadataChip>
                    ) : toAccount?.type === AccountType.ASSETS ? (
                      <MetadataChip label="Asset">
                        <AssetSelect
                          size="sm"
                          className="w-fit text-xs"
                          accountId={transaction.toAccount}
                          value={transaction.toAsset || ""}
                          onValueChange={(asset) =>
                            onUpdate?.({
                              toAsset: asset,
                            })
                          }
                          placeholder="None"
                        />
                      </MetadataChip>
                    ) : (
                      <div className="h-7" aria-hidden="true" />
                    ))}
                  {fundRowExists &&
                    (isToBalance ? (
                      <MetadataChip label="Fund">
                        <FundSelect
                          size="sm"
                          className="w-fit text-xs"
                          value={trackedToFund?.id ?? null}
                          onValueChange={(fundId) =>
                            handleFundChange("to", fundId)
                          }
                          placeholder="Untracked"
                          allowEmpty
                          emptyLabel="Untracked"
                        />
                      </MetadataChip>
                    ) : (
                      <div className="h-7" aria-hidden="true" />
                    ))}
                </div>
              )}
            </div>

            {/* The leg's amount and actions, on the flow line */}
            <div className="flex shrink-0 items-center justify-end gap-1">
              <AmountInput
                value={transaction.amount}
                onChange={(amount) => {
                  onUpdate?.({
                    amount,
                  });
                }}
                mode="cell"
                className="w-26"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Transaction actions"
                  >
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.()}
                  >
                    <TrashIcon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isFocused && (
            <>
              {/* Deep-link focus: the hairline border thickens into a primary
              ring, drawn as an overlay so the row never shifts */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              />
              {/* A one-shot tint flash settling into the steady ring, so the
              arrival reads as "you came here for this leg" */}
              {!prefersReducedMotion && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-lg bg-primary/10"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
            </>
          )}
        </div>
      </ContextMenuTrigger>
      {onDelete && (
        <ContextMenuContent>
          <ContextMenuItem variant="destructive" onClick={() => onDelete()}>
            <TrashIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
