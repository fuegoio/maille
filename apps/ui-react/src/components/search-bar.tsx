import { useHotkey } from "@tanstack/react-hotkeys";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import * as React from "react";

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { useViewSearch } from "@/stores/search";

export function SearchBar() {
  const { search, setSearch, clearSearch } = useViewSearch();

  const [visible, setVisible] = React.useState(search !== "");
  const [inputRef, setInputRef] = React.useState<HTMLInputElement | null>(null);

  useHotkey("Mod+F", (event) => {
    event.preventDefault();
    setVisible(true);
  });

  React.useEffect(() => {
    if (visible) {
      inputRef?.focus();
    }
  }, [visible, inputRef]);

  const handleClose = () => {
    setVisible(false);
    clearSearch();
  };

  const handleBlur = () => {
    if (search === "") {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <InputGroup className="max-w-xs">
            <InputGroupInput
              id="search"
              name="search"
              ref={setInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClose();
                  e.stopPropagation();
                }
              }}
              placeholder="Search..."
              className="flex-1"
            />
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
