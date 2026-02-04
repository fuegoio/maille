import * as React from "react";
import { useStore } from "zustand";
import { searchStore } from "@/stores/search";
import { InputGroup, InputGroupInput, InputGroupButton } from "@/components/ui/input-group";
import { Search } from "lucide-react";

export function SearchBar() {
  const [show, setShow] = React.useState(false);
  const [inputRef, setInputRef] = React.useState<HTMLInputElement | null>(null);

  const search = useStore(searchStore, (state) => state.search);
  const setSearch = useStore(searchStore, (state) => state.setSearch);
  const clearSearch = useStore(searchStore, (state) => state.clearSearch);

  const handleBlur = () => {
    if (search === "") {
      clear();
    }
  };

  const clear = () => {
    clearSearch();
    setShow(false);
  };

  // Handle Ctrl+F keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setShow(true);
        // Focus the input field when shown
        setTimeout(() => {
          inputRef?.focus();
        }, 100);
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

  if (!show) return null;

  return (
    <div className="flex h-14 items-center border-b px-4 transition-all duration-200 ease-in-out">
      <InputGroup className="w-full">
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
          placeholder="Find in view ..."
          autoFocus
          className="flex-1"
        />
        <InputGroupButton type="button" onClick={clear}>
          <Search className="h-4 w-4 text-muted-foreground" />
        </InputGroupButton>
      </InputGroup>
    </div>
  );
}
