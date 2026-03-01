import { type Transaction } from "@maille/core/activities";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTemplates } from "@/stores/templates";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseAmount: number;
  transactions: Omit<Transaction, "id">[];
  onTemplateSaved?: () => void;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  baseAmount,
  transactions,
  onTemplateSaved,
}: SaveTemplateDialogProps) {
  const [templateName, setTemplateName] = React.useState("");
  const { addTemplate } = useTemplates();

  const handleSave = () => {
    if (!templateName.trim()) return;

    addTemplate({
      name: templateName,
      transactions: transactions.map((t) => ({
        ...t,
        id: undefined,
        amount: t.amount / baseAmount,
      })),
    });

    setTemplateName("");
    onTemplateSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
        </DialogHeader>

        <div className="pb-4">
          <Field>
            <FieldLabel htmlFor="template-name">Template name</FieldLabel>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
              autoFocus
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
