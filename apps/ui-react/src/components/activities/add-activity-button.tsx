import type { ActivityType } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
  type?: ActivityType;
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
  type,
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
        className={className}
        variant="default"
        size={iconOnly ? "icon" : size}
      >
        <Plus />
        {!iconOnly && "Add activity"}
      </Button>

      <AddActivityModal
        open={showModal}
        onOpenChange={setShowModal}
        movement={movement}
        category={category}
        subcategory={subcategory}
        project={project}
        date={date}
        type={type}
      />
    </>
  );
}
