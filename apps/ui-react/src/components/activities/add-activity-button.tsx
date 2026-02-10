import type { Movement } from "@maille/core/movements";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";

import { AddActivityModal } from "./add-activity-modal";

interface AddActivityButtonProps {
  onClick?: () => void;
  className?: string;
  movement?: Movement;
}

export function AddActivityButton({
  onClick,
  className,
  movement,
}: AddActivityButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setShowModal(true);
  };

  // Add hotkey support (Ctrl+C or Cmd+C)
  useHotkeys("c", () => {
    setShowModal(true);
  });

  return (
    <>
      <Button onClick={handleClick} className={className} variant="default">
        <Plus />
        Add activity
      </Button>

      <AddActivityModal
        open={showModal}
        onOpenChange={setShowModal}
        movement={movement}
      />
    </>
  );
}
