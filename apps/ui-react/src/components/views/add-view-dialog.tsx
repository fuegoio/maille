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
import { useViewMutations } from "@/components/views/view-mutations";
import {
  useScopeResources,
  VIEW_RESOURCES,
} from "@/components/views/view-resources";
import { cn } from "@/lib/utils";

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

  const resources = useScopeResources(scope);
  const [requestedResource, setResource] = React.useState<ViewResource>(
    resources[0],
  );
  const resource = resources.includes(requestedResource)
    ? requestedResource
    : resources[0];

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
              <FieldLabel>Displayed resource</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {resources.map((entry) => {
                  const definition = VIEW_RESOURCES[entry];
                  const Icon = definition.icon;
                  return (
                    <Button
                      key={entry}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={resource === entry}
                      onClick={() => setResource(entry)}
                      className={cn(
                        "gap-1.5",
                        resource === entry && "border-foreground/30 bg-muted",
                      )}
                    >
                      <Icon />
                      {definition.label}
                    </Button>
                  );
                })}
              </div>
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
