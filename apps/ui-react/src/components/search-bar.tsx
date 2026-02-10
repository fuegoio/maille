import { Search } from "lucide-react";
import * as React from "react";

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { useSearch } from "@/stores/search";

export function SearchBar() {
  const [inputRef, setInputRef] = React.useState<HTMLInputElement | null>(null);

  const search = useSearch((state) => state.search);
  const setSearch = useSearch((state) => state.setSearch);
  const clearSearch = useSearch((state) => state.clearSearch);

  const handleBlur = () => {
    if (search === "") {
      clear();
    }
  };

  const clear = () => {
    clearSearch();
  };

  // Handle Ctrl+F keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        inputRef?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputRef]);

  React.useEffect(() => {
    return () => {
      clear();
    };
  }, []);

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        ref={setInputRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            clear();
          }
        }}
        placeholder="Search..."
        className="flex-1"
      />
      <InputGroupAddon onClick={clear}>
        <Search className="h-4 w-4 text-muted-foreground" />
      </InputGroupAddon>
    </InputGroup>
  );
}
