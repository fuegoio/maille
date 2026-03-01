import { useHotkey } from "@tanstack/react-hotkeys";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface MovementsSelectionProps {
  selectedMovements: string[];
  onClearSelection: () => void;
}

export function MovementsSelection({
  selectedMovements,
  onClearSelection,
}: MovementsSelectionProps) {
  const [paletteOpened, setPaletteOpened] = useState(false);
  const show = selectedMovements.length > 0;

  useHotkey("Mod+K", (event) => {
    if (!selectedMovements.length) return null;
    event.preventDefault();
    setPaletteOpened(true);
  });

  if (!show) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.12,
            type: "keyframes",
            ease: "easeInOut",
          }}
          className="fixed right-0 bottom-5 left-0 z-40 flex justify-center"
        >
          <div className="flex items-center gap-2 rounded bg-muted p-2 shadow-xl">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onClearSelection}
            >
              <span>{selectedMovements.length} selected</span>
              <X className="h-4 w-4" />
            </Button>
            <div className="border-primary-800 h-5 w-[1px] border-r" />

            <Button
              variant="default"
              size="sm"
              onClick={() => setPaletteOpened(true)}
            >
              Actions
              <div className="rounded bg-muted/20 px-1.5 py-0.5 text-xs tracking-widest">
                ⌘K
              </div>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
