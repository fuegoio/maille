import { Plus, Search } from "lucide-react";
import * as React from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createInvestmentMutation } from "@/mutations/investments";
import { useInvestments } from "@/stores/investments";
import { useSync } from "@/stores/sync";

interface InvestmentSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  accountId: string;
  className?: string;
  size?: "sm" | "default";
  placeholder?: string;
}

export function InvestmentSelect({
  accountId,
  value,
  onValueChange,
  className,
  size = "default",
  placeholder = "Select an investment",
}: InvestmentSelectProps) {
  const investments = useInvestments((state) => state.investments);
  const mutate = useSync((state) => state.mutate);
  const accountInvestments = investments.filter(
    (investment) => investment.account === accountId,
  );

  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  React.useEffect(() => {
    if (open) {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice) return;
      const frame = requestAnimationFrame(() =>
        searchInputRef.current?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  const filteredInvestments = React.useMemo(() => {
    return accountInvestments.filter((investment) =>
      investment.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [accountInvestments, searchTerm]);

  const handleInvestmentChange = (investmentId: string) => {
    if (investmentId === "create-new") {
      handleCreate();
    } else {
      onValueChange(investmentId);
    }
  };

  // Creating from the select skips the modal: the position lands on
  // the account optimistically and is selected right away
  const handleCreate = () => {
    const investment = {
      id: crypto.randomUUID(),
      account: accountId,
      name: searchTerm.trim(),
      symbol: null,
      description: null,
      initialQuantity: 0,
    };

    mutate({
      name: "createInvestment",
      mutation: createInvestmentMutation,
      variables: investment,
      rollbackData: undefined,
      events: [
        {
          type: "createInvestment",
          payload: investment,
        },
      ],
    });

    onValueChange(investment.id);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) =>
        Math.min(i + 1, filteredInvestments.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filteredInvestments[index]) {
        onValueChange(filteredInvestments[index].id);
        setOpen(false);
      } else if (searchTerm) {
        handleCreate();
        setOpen(false);
      }
    }
  };

  return (
    <Select
      value={value || ""}
      onValueChange={handleInvestmentChange}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger size={size} className={className} aria-label="Investment">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        onPointerDownOutside={(e) => {
          if (document.activeElement === searchInputRef.current)
            e.preventDefault();
        }}
      >
        {/* Search input */}
        <InputGroup className="gap-1 rounded-none border-t-0 border-r-0 border-b border-l-0 bg-background! ring-0!">
          <InputGroupInput
            ref={searchInputRef}
            type="text"
            placeholder="Search ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <InputGroupAddon>
            <Search className="size-3 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        {accountInvestments.map((investment) => {
          const visibleIndex = filteredInvestments.findIndex(
            (f) => f.id === investment.id,
          );
          const isHidden = visibleIndex === -1;
          const isHighlighted = visibleIndex === highlightedIndex;
          return (
            <SelectItem
              key={investment.id}
              value={investment.id}
              className={cn(
                "px-2",
                isHidden && "hidden",
                isHighlighted && "bg-accent text-accent-foreground",
              )}
            >
              <span>{investment.name}</span>
            </SelectItem>
          );
        })}

        {/* Investments list */}
        {filteredInvestments.length === 0 && (
          <>
            {searchTerm ? (
              <SelectItem value="create-new" className="px-2">
                <Plus />
                Create new investment:{" "}
                <span className="text-muted-foreground">"{searchTerm}"</span>
              </SelectItem>
            ) : (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No investments available.
              </p>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
