import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import type { UUID } from "crypto";

interface MovementsActionsProps {
  selectedMovements: UUID[];
  onClearSelection: () => void;
}

export function MovementsActions({ 
  selectedMovements, 
  onClearSelection 
}: MovementsActionsProps) {
  const movements = useStore(movementsStore, (state) => state.movements);

  const show = selectedMovements.length > 0;

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
            ease: "easeInOut"
          }}
          className="fixed bottom-5 left-0 right-0 flex justify-center z-40"
        >
          <div className="flex gap-2 p-2 shadow-xl bg-primary-950 rounded items-center">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onClearSelection}
            >
              <span>{selectedMovements.length} selected</span>
              <X className="h-4 w-4" />
            </Button>
            <div className="border-r border-primary-800 h-5 w-[1px]" />

            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => console.log("Create activities")}
            >
              <span className="font-medium text-xs">Create activities</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}