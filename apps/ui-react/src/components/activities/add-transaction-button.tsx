import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddTransactionButtonProps {
  onClick?: () => void;
  className?: string;
}

export function AddTransactionButton({ onClick, className }: AddTransactionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={className}
      variant="outline"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-2" />
      <span>Add Transaction</span>
    </Button>
  );
}