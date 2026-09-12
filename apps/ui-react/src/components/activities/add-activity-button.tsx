import type { Movement } from "@maille/core/movements";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AddActivityModal } from "./add-activity-modal";

interface AddActivityButtonProps {
  onClick?: () => void;
  className?: string;
  movement?: Movement;
  size?: "default" | "sm" | "lg";
  category?: string;
  subcategory?: string;
  project?: string;
  date?: Date;
  iconOnly?: boolean;
}

export function AddActivityButton({
  onClick,
  className,
  movement,
  size = "default",
  category,
  subcategory,
  project,
  date,
  iconOnly = false,
}: AddActivityButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setShowModal(true);
  };

  useHotkey("C", (event) => {
    if (event.key !== "c") return;
    setShowModal(true);
  });

  return (
    <>
      <Button
        onClick={handleClick}
        className={cn(
          className,
          !iconOnly &&
            (size === "sm"
              ? "w-7 px-0 sm:w-auto sm:px-2.5"
              : "w-8 px-0 sm:w-auto sm:px-2.5"),
        )}
        variant="outline"
        size={iconOnly ? "icon" : size}
        aria-label="Add activity"
      >
        <Plus />
        {!iconOnly && <span className="hidden sm:inline">Add activity</span>}
      </Button>

      <AddActivityModal
        open={showModal}
        onOpenChange={setShowModal}
        movement={movement}
        category={category}
        subcategory={subcategory}
        project={project}
        date={date}
      />
    </>
  );
}
