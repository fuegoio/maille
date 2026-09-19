import type { View, ViewConfig as CustomViewConfig } from "@maille/core/views";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useViewMutations } from "@/components/views/view-mutations";
import { viewResourceDefinition } from "@/components/views/view-resources";

interface CustomViewActionsProps {
  view: View;
  onConfigChange: (config: CustomViewConfig) => void;
  /** Called after the view is deleted, so the page can leave its tab. */
  onDeleted?: () => void;
  className?: string;
}

/**
 * The standard actions of a selected custom view: filter, settings,
 * export, then rename and delete. Each comes from the view resource's
 * registry entry, so every resource provides the same set.
 */
export function CustomViewActions({
  view,
  onConfigChange,
  onDeleted,
  className,
}: CustomViewActionsProps) {
  const definition = viewResourceDefinition(view);
  const { renameView, deleteView } = useViewMutations();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [name, setName] = React.useState(view.name);

  const DefinitionFilterButton = definition.FilterButton;
  const DefinitionSettingsButton = definition.SettingsButton;
  const DefinitionExportButton = definition.ExportButton;

  return (
    <>
      <DefinitionFilterButton view={view} onConfigChange={onConfigChange} />
      <DefinitionSettingsButton view={view} onConfigChange={onConfigChange} />
      <DefinitionExportButton view={view} className="hidden sm:flex" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="View actions"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setName(view.name);
              setRenameOpen(true);
            }}
          >
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent aria-label="Rename view">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim() === "") return;
              renameView(view, name.trim());
              setRenameOpen(false);
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>Rename view</DialogTitle>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="rename-view-name">Name</FieldLabel>
              <Input
                id="rename-view-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={name.trim() === ""}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete view</AlertDialogTitle>
            <AlertDialogDescription>
              The view "{view.name}" and its filters and settings will be
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteView(view);
                setDeleteOpen(false);
                onDeleted?.();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
