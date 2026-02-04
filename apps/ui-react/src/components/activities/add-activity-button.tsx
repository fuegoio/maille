import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import { AddActivityModal } from "./add-activity-modal";
import type { Movement } from "@maille/core/movements";

interface AddActivityButtonProps {
  onClick?: () => void;
  className?: string;
  movement?: Movement;
  large?: boolean;
}

export function AddActivityButton({
  onClick,
  className,
  movement,
  large = false,
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
      <Button
        onClick={handleClick}
        className={className}
        variant="default"
        size={large ? "default" : "sm"}
      >
        <Plus className={`mr-2 h-4 w-4 ${large ? "" : "hidden sm:inline"}`} />
        <span className={large ? "text-sm" : "text-xs sm:text-sm"}>Add Activity</span>
      </Button>

      <AddActivityModal
        open={showModal}
        onOpenChange={setShowModal}
        user="current-user" // This should be replaced with actual user from context/auth
        movement={movement}
      />
    </>
  );
}
