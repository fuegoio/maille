import type { ViewResource, ViewScope } from "@maille/core/views";

import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useViewMutations } from "@/components/views/view-mutations";
import {
  scopeResources,
  useDisabledResources,
  VIEW_RESOURCES,
} from "@/components/views/view-resources";

interface AddViewDialogProps {
  scope: ViewScope;
  /** Called with the created view's id, so the page can select its tab. */
  onCreated: (viewId: string) => void;
  children?: React.ReactNode;
}

/**
 * Creates a custom view attached to a scope: a name and which resource
 * it displays. The scope decides which resources are offered.
 */
export function AddViewDialog({
  scope,
  onCreated,
  children,
}: AddViewDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const { createView } = useViewMutations();

  const resources = scopeResources(scope);
  const disabled = useDisabledResources(scope);
  const [requestedResource, setResource] = React.useState<ViewResource>(
    resources[0],
  );
  // A disabled resource can't be picked: fall back to the first pickable one.
  const resource = disabled.includes(requestedResource)
    ? resources.find((entry) => !disabled.includes(entry))!
    : requestedResource;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === "") return;
    const viewId = createView({
      name: name.trim(),
      scope,
      config: VIEW_RESOURCES[resource].defaultConfig(scope),
    });
    setName("");
    setOpen(false);
    onCreated(viewId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add a custom view"
            title="Add a custom view"
          >
            <Plus />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent aria-label="Add a custom view">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New view</DialogTitle>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="new-view-name">Name</FieldLabel>
            <Input
              id="new-view-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="View name"
              autoFocus
            />
          </Field>

          {resources.length > 1 && (
            <Field>
              <FieldLabel htmlFor="new-view-resource">
                Displayed resource
              </FieldLabel>
              <Select
                value={resource}
                onValueChange={(value) => setResource(value as ViewResource)}
              >
                <SelectTrigger id="new-view-resource">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((entry) => {
                    const definition = VIEW_RESOURCES[entry];
                    const Icon = definition.icon;
                    return (
                      <SelectItem
                        key={entry}
                        value={entry}
                        disabled={disabled.includes(entry)}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon />
                          {definition.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
          )}

          <DialogFooter>
            <Button type="submit" disabled={name.trim() === ""}>
              Create view
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
