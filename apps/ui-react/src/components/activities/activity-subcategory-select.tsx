import { Plus, Search, X } from "lucide-react";
import * as React from "react";

import { CreateSubcategoryDialog } from "@/components/categories/create-subcategory-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

interface ActivitySubcategorySelectProps {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  categoryId?: string | null;
  subcategories: Array<{
    id: string;
    name: string;
    category: string;
    emoji: string | null;
  }>;
  disabled?: boolean;
  placeholder?: string;
}

export function ActivitySubcategorySelect({
  value,
  onValueChange,
  categoryId,
  subcategories,
  disabled,
  placeholder = "Subcategory",
}: ActivitySubcategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  const filteredSubcategories = React.useMemo(() => {
    return subcategories.filter((sc) => {
      const matchesCategory = categoryId ? sc.category === categoryId : true;
      const matchesSearch = sc.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [subcategories, categoryId, searchTerm]);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  React.useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() =>
        searchInputRef.current?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) =>
        Math.min(i + 1, filteredSubcategories.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filteredSubcategories[index]) {
        handleValueChange(filteredSubcategories[index].id);
        setOpen(false);
      }
    }
  };

  const handleValueChange = (val: string) => {
    if (val === "create-new") {
      setOpenCreate(true);
    } else if (val === "clear") {
      onValueChange?.(null);
    } else {
      onValueChange?.(val);
    }
  };

  const handleSubcategoryCreated = (subcategoryId: string) => {
    onValueChange?.(subcategoryId);
  };

  return (
    <Select
      value={value || ""}
      onValueChange={handleValueChange}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled || !categoryId}
    >
      <SelectTrigger>
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

        {subcategories
          .filter((sc) => (categoryId ? sc.category === categoryId : true))
          .map((sc) => {
            const visibleIndex = filteredSubcategories.findIndex(
              (f) => f.id === sc.id,
            );
            const isHidden = visibleIndex === -1;
            const isHighlighted = visibleIndex === highlightedIndex;
            return (
              <SelectItem
                key={sc.id}
                value={sc.id}
                className={cn(
                  "px-2",
                  isHidden && "hidden",
                  isHighlighted && "bg-accent text-accent-foreground",
                )}
              >
                {sc.emoji && <span className="mr-1">{sc.emoji}</span>}
                <span>{sc.name}</span>
              </SelectItem>
            );
          })}

        {filteredSubcategories.length === 0 && (
          <>
            {searchTerm ? (
              <SelectItem value="create-new" className="px-2">
                <Plus />
                Create new subcategory:{" "}
                <span className="text-muted-foreground">"{searchTerm}"</span>
              </SelectItem>
            ) : (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No subcategories available.
              </p>
            )}
          </>
        )}

        {searchTerm.length === 0 && value && (
          <SelectItem value="clear" className="px-2 text-muted-foreground">
            <X />
            Remove subcategory
          </SelectItem>
        )}
      </SelectContent>

      {openCreate && categoryId && (
        <CreateSubcategoryDialog
          open={openCreate}
          onOpenChange={setOpenCreate}
          categoryId={categoryId}
          initialName={searchTerm}
          onSubcategoryCreated={handleSubcategoryCreated}
        />
      )}
    </Select>
  );
}
