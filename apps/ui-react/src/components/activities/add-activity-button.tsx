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
  onCreated?: (activityNumber: number) => void;
  size?: "default" | "sm" | "lg";
}

export function AddActivityButton({
  onClick,
  className,
  movement,
  onCreated,
  size = "default",
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
        size={size}
      >
        <Plus />
        Add activity
      </Button>

      <AddActivityModal
        open={showModal}
        onOpenChange={setShowModal}
        movement={movement}
        onCreated={onCreated}
      />
    </>
  );
}
