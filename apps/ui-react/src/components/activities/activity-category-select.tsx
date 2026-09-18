import { Plus, X } from "lucide-react";
import * as React from "react";

import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectSearchInput } from "@/components/ui/select-search-input";
import { cn } from "@/lib/utils";

interface ActivityCategorySelectProps {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  categories: Array<{
    id: string;
    name: string;
    emoji: string | null;
  }>;
  disabled?: boolean;
  placeholder?: string;
}

export function ActivityCategorySelect({
  value,
  onValueChange,
  categories,
  disabled,
  placeholder = "Category",
}: ActivityCategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

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
    } else if (!openCreate) {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) =>
        Math.min(i + 1, filteredCategories.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filteredCategories[index]) {
        handleCategoryChange(filteredCategories[index].id);
        setOpen(false);
      }
    }
  };

  // Filter categories based on the search term
  const filteredCategories = React.useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [categories, searchTerm]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "create-new") {
      setOpenCreate(true);
    } else if (categoryId === "clear") {
      onValueChange?.(null);
    } else {
      onValueChange?.(categoryId);
    }
  };

  const handleCategoryCreated = (categoryId: string) => {
    if (onValueChange) {
      onValueChange(categoryId);
    }
  };

  return (
    <Select
      value={value || ""}
      onValueChange={handleCategoryChange}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled || categories.length === 0}
    >
      <SelectTrigger aria-label="Category">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        onPointerDownOutside={(e) => {
          if (document.activeElement === searchInputRef.current)
            e.preventDefault();
        }}
      >
        <SelectSearchInput
          ref={searchInputRef}
          aria-label="Search categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />

        {categories.map((cat) => {
          const visibleIndex = filteredCategories.findIndex(
            (f) => f.id === cat.id,
          );
          const isHidden = visibleIndex === -1;
          const isHighlighted = visibleIndex === highlightedIndex;
          return (
            <SelectItem
              key={cat.id}
              value={cat.id}
              className={cn(
                "px-2",
                isHidden && "hidden",
                isHighlighted && "bg-accent text-accent-foreground",
              )}
            >
              {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
              <span>{cat.name}</span>
            </SelectItem>
          );
        })}

        {/* Categories list */}
        {filteredCategories.length === 0 && (
          <>
            {searchTerm ? (
              <SelectItem value="create-new" className="px-2">
                <Plus />
                Create new category:{" "}
                <span className="text-muted-foreground">"{searchTerm}"</span>
              </SelectItem>
            ) : (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No categories available.
              </p>
            )}
          </>
        )}

        {searchTerm.length === 0 && value && (
          <SelectItem value="clear" className="px-2 text-muted-foreground">
            <X />
            Remove category
          </SelectItem>
        )}
      </SelectContent>

      {openCreate && (
        <CreateCategoryDialog
          open={openCreate}
          onOpenChange={setOpenCreate}
          initialName={searchTerm}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </Select>
  );
}
