import { useHotkey } from "@tanstack/react-hotkeys";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityActionValue = {
  value: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
};

export type EntityAction = {
  value: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  /** "input" = text prompt, "select" = submenu of values, null = direct action */
  type: "input" | "select" | null;
  placeholder?: string;
  defaultValue?: string;
  /** Called for null and input actions. For input, receives the typed value. */
  action?: (value?: string) => void;
  /** Called for select actions to enumerate the submenu values. */
  getValues?: () => EntityActionValue[];
  /** Render as destructive in the context menu. */
  variant?: "default" | "destructive";
};

// ---------------------------------------------------------------------------
// Command palette dialog (shared UI for the ⌘K multi-step dialog)
// ---------------------------------------------------------------------------

interface CommandPaletteDialogProps {
  actions: EntityAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection?: () => void;
  /** e.g. "3 activities selected", "1 movement selected" */
  heading: string;
}

export function CommandPaletteDialog({
  actions,
  open,
  onOpenChange,
  onClearSelection,
  heading,
}: CommandPaletteDialogProps) {
  const [search, setSearch] = React.useState("");
  const [step, setStep] = React.useState<"action" | "value" | "input">(
    "action",
  );
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null,
  );
  const [inputValue, setInputValue] = React.useState("");

  const filteredActions = React.useMemo(() => {
    if (!search) return actions;
    return actions.filter((action) =>
      action.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actions]);

  const actionValues = React.useMemo(() => {
    if (!selectedAction) return [];
    const action = actions.find((a) => a.value === selectedAction);
    return action && action.type === "select" ? action.getValues!() : [];
  }, [selectedAction, actions]);

  const filteredValues = React.useMemo(() => {
    if (!search) return actionValues;
    return actionValues.filter((value) =>
      value.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actionValues]);

  const handleActionSelect = (actionValue: string) => {
    const action = actions.find((a) => a.value === actionValue);
    if (!action || action.disabled) return;

    if (action.type === "input") {
      setSelectedAction(actionValue);
      setStep("input");
      setInputValue(action.defaultValue || "");
    } else if (action.type === "select") {
      setSelectedAction(actionValue);
      setStep("value");
      setSearch("");
    } else {
      action.action?.();
      onClearSelection?.();
      onOpenChange(false);
      reset();
    }
  };

  const handleInputSubmit = () => {
    if (!selectedAction) return;
    const action = actions.find((a) => a.value === selectedAction);
    if (action && action.type === "input") {
      action.action?.(inputValue);
      onOpenChange(false);
      reset();
    }
  };

  const reset = () => {
    setStep("action");
    setSelectedAction(null);
    setInputValue("");
    setSearch("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false}>
        {step === "input" ? (
          <div className="flex items-center">
            <CommandInput
              placeholder={
                actions.find((a) => a.value === selectedAction)?.placeholder ||
                "Enter value..."
              }
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit();
                }
              }}
            />
            <CommandShortcut className="mr-2 text-sm">Enter</CommandShortcut>
          </div>
        ) : (
          <>
            <CommandInput
              placeholder={
                step === "action"
                  ? "Type a command or search..."
                  : `Search ${selectedAction}...`
              }
              value={search}
              onValueChange={setSearch}
            />
            <div className="h-px w-full bg-border" />
          </>
        )}

        <CommandList>
          {step === "action" && (
            <>
              <CommandEmpty>No actions found.</CommandEmpty>
              <CommandGroup heading={heading}>
                {filteredActions.map((action) => (
                  <CommandItem
                    key={action.value}
                    value={action.value}
                    onSelect={() => handleActionSelect(action.value)}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    {action.label}
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {step === "value" && (
            <>
              <CommandEmpty>No values found.</CommandEmpty>
              <CommandGroup
                heading={actions.find((a) => a.value === selectedAction)?.label}
              >
                {filteredValues.map((value) => (
                  <CommandItem
                    key={value.value}
                    value={value.value}
                    onSelect={() => {
                      value.action();
                      onOpenChange(false);
                      reset();
                    }}
                  >
                    {value.icon}
                    {value.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// ---------------------------------------------------------------------------
// Selection bar (floating ⌘K bar at the bottom of the page)
// ---------------------------------------------------------------------------

interface SelectionBarProps {
  selectedIds: string[];
  actions: EntityAction[];
  /** singular entity name, e.g. "activity" */
  entityName: string;
  onClearSelection: () => void;
}

export function SelectionBar({
  selectedIds,
  actions,
  entityName,
  onClearSelection,
}: SelectionBarProps) {
  const [paletteOpened, setPaletteOpened] = React.useState(false);
  const show = selectedIds.length > 0;

  useHotkey("Mod+K", (event) => {
    if (!selectedIds.length) return;
    event.preventDefault();
    setPaletteOpened(true);
  });

  if (!show) return null;

  const heading = `${selectedIds.length} ${entityName}${selectedIds.length > 1 ? "s" : ""} selected`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            duration: 0.12,
            type: "keyframes",
            ease: "easeInOut",
          }}
          className="fixed right-0 bottom-5 left-0 z-40 flex justify-center"
        >
          <div className="flex items-center gap-2 rounded bg-muted p-2 shadow-xl">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={onClearSelection}
            >
              <span>{selectedIds.length} selected</span>
              <X className="h-4 w-4" />
            </Button>
            <div className="border-primary-800 h-5 w-[1px] border-r" />

            <Button
              variant="default"
              size="sm"
              onClick={() => setPaletteOpened(true)}
            >
              Actions
              <div className="rounded bg-muted/20 px-1.5 py-0.5 text-xs tracking-widest">
                ⌘K
              </div>
            </Button>
          </div>

          <CommandPaletteDialog
            actions={actions}
            open={paletteOpened}
            onOpenChange={setPaletteOpened}
            onClearSelection={onClearSelection}
            heading={heading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Context menu (right-click menu as an alternative to the command palette)
// ---------------------------------------------------------------------------

interface EntityContextMenuProps {
  actions: EntityAction[];
  onClearSelection?: () => void;
  /** Called when the menu closes after an action, to clear selection. */
  onActionComplete?: () => void;
  children: React.ReactNode;
}

export function EntityContextMenu({
  actions,
  onActionComplete,
  children,
}: EntityContextMenuProps) {
  const [inputAction, setInputAction] = React.useState<EntityAction | null>(
    null,
  );
  const [inputValue, setInputValue] = React.useState("");

  const handleDirectAction = (action: EntityAction) => {
    action.action?.();
    onActionComplete?.();
  };

  const handleInputSubmit = () => {
    if (inputAction) {
      inputAction.action?.(inputValue);
      setInputAction(null);
      setInputValue("");
      onActionComplete?.();
    }
  };

  const hasActions = actions.length > 0;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        {hasActions && (
          <ContextMenuContent>
            {actions.map((action) => {
              if (action.type === "select" && action.getValues) {
                const values = action.getValues();
                return (
                  <ContextMenuSub key={action.value}>
                    <ContextMenuSubTrigger disabled={action.disabled}>
                      {action.icon}
                      {action.label}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      {values.map((value) => (
                        <ContextMenuItem
                          key={value.value}
                          onClick={() => {
                            value.action();
                            onActionComplete?.();
                          }}
                        >
                          {value.icon}
                          {value.label}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                );
              }

              return (
                <React.Fragment key={action.value}>
                  {action.variant === "destructive" && <ContextMenuSeparator />}
                  <ContextMenuItem
                    variant={action.variant}
                    disabled={action.disabled}
                    onClick={() => {
                      if (action.type === "input") {
                        setInputAction(action);
                        setInputValue(action.defaultValue || "");
                      } else {
                        handleDirectAction(action);
                      }
                    }}
                  >
                    {action.icon}
                    {action.label}
                    {action.shortcut && (
                      <ContextMenuShortcut>
                        {action.shortcut}
                      </ContextMenuShortcut>
                    )}
                  </ContextMenuItem>
                </React.Fragment>
              );
            })}
          </ContextMenuContent>
        )}
      </ContextMenu>

      {inputAction && (
        <InputDialog
          title={inputAction.label}
          placeholder={inputAction.placeholder || "Enter value..."}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleInputSubmit}
          onCancel={() => {
            setInputAction(null);
            setInputValue("");
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Input dialog (small modal for input-type actions triggered from context menu)
// ---------------------------------------------------------------------------

function InputDialog({
  title,
  placeholder,
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border bg-popover p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-sm font-medium">{title}</div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={placeholder}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
