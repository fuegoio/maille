import type { TransactionFilter } from "@maille/core/views";

import { Button } from "@/components/ui/button";

import { FilterTransactionsButton } from "./filter-transactions-button";
import { TransactionFilter as TransactionFilterRow } from "./transaction-filter";

interface TransactionsFiltersProps {
  filters: TransactionFilter[];
  onFiltersChange: (filters: TransactionFilter[]) => void;
}

export function TransactionsFilters({
  filters,
  onFiltersChange,
}: TransactionsFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/50 px-2 sm:pl-11.25">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter, index) => (
          <TransactionFilterRow
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              onFiltersChange(
                filters.map((f, i) => (i === index ? newFilter : f)),
              );
            }}
            onDelete={() => {
              onFiltersChange(filters.filter((_, i) => i !== index));
            }}
          />
        ))}

        <FilterTransactionsButton
          filters={filters}
          onFiltersChange={onFiltersChange}
          variant="mini"
        />
      </div>

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <Button
          variant="ghost"
          onClick={() => onFiltersChange([])}
          size="sm"
          className="mr-2"
        >
          Clear
        </Button>
      </div>
    </header>
  );
}
