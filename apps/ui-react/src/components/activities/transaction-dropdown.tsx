import { type Transaction } from "@maille/core/activities";
import {
  Trash2,
  Layers,
  LayersPlus,
  CornerRightDown,
  ListPlus,
  Plus,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTemplates } from "@/stores/templates";

import { SaveTemplateDialog } from "./save-template-dialog";

interface TransactionDropdownProps {
  transactions: Omit<Transaction, "id">[];
  baseAmount: number;
  onAddTransaction: () => void;
  onApplyTemplate: (transactions: Omit<Transaction, "id">[]) => void;
}

export function TransactionDropdown({
  transactions,
  baseAmount,
  onAddTransaction,
  onApplyTemplate,
}: TransactionDropdownProps) {
  const { templates, deleteTemplate } = useTemplates();
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const handleSaveTemplate = () => {
    setShowSaveDialog(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const transactions = template.transactions.map((t) => ({
      ...t,
      amount: t.amount * baseAmount,
    }));

    onApplyTemplate(transactions);
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <ListPlus />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={onAddTransaction}>
            <Plus />
            Add transaction
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Templates</DropdownMenuLabel>
            {templates.map((template) => (
              <DropdownMenuSub key={template.id}>
                <DropdownMenuSubTrigger>{template.name}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    <CornerRightDown />
                    <span>Apply template</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteTemplate(template.id)}
                    variant="destructive"
                  >
                    <Trash2 />
                    <span>Delete template</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            {templates.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                No template saved yet.
              </div>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSaveTemplate}>
            <LayersPlus className="h-4 w-4" />
            <span>Save as template</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveTemplateDialog
        open={showSaveDialog}
        baseAmount={baseAmount}
        onOpenChange={setShowSaveDialog}
        transactions={transactions}
      />
    </>
  );
}
