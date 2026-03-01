import { ActivityType } from "@maille/core/activities";
import { Plus, Search, X } from "lucide-react";
import * as React from "react";

import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";

interface ActivityCategorySelectProps {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  type?: ActivityType;
  categories: Array<{
    id: string;
    name: string;
    type: ActivityType;
    emoji: string | null;
  }>;
  disabled?: boolean;
  placeholder?: string;
}

export function ActivityCategorySelect({
  value,
  onValueChange,
  type,
  categories,
  disabled,
  placeholder = "Category",
}: ActivityCategorySelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);

  // Filter categories based on search term and type
  const filteredCategories = React.useMemo(() => {
    return categories.filter((category) => {
      const matchesType = type ? category.type === type : true;
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [categories, type, searchTerm]);

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
      disabled={disabled || categories.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <InputGroup className="gap-1 rounded-none border-t-0 border-r-0 border-b border-l-0 bg-background! ring-0!">
          <InputGroupInput
            type="text"
            placeholder="Search ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <InputGroupAddon>
            <Search className="size-3 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>

        {filteredCategories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id} className="px-2">
            {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
            <span>{cat.name}</span>
          </SelectItem>
        ))}

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
          initialType={type}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </Select>
  );
}
