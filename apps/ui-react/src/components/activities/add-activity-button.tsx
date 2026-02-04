import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddActivityButtonProps {
  onClick?: () => void;
  className?: string;
}

export function AddActivityButton({ onClick, className }: AddActivityButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={className}
      variant="default"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-2" />
      <span>Add Activity</span>
    </Button>
  );
}