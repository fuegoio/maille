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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);

  const filteredSubcategories = React.useMemo(() => {
    return subcategories.filter((sc) => {
      const matchesCategory = categoryId ? sc.category === categoryId : true;
      const matchesSearch = sc.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [subcategories, categoryId, searchTerm]);

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
      disabled={disabled || !categoryId}
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

        {filteredSubcategories.map((sc) => (
          <SelectItem key={sc.id} value={sc.id} className="px-2">
            {sc.emoji && <span className="mr-1">{sc.emoji}</span>}
            <span>{sc.name}</span>
          </SelectItem>
        ))}

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
