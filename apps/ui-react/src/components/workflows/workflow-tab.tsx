import type { MovementWorkflow } from "@maille/core/harness";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Minus,
  X,
  XCircle,
  Clock,
  PauseCircle,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { answerWorkflowMutation } from "@/mutations/workflows";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";
import { useWorkflows } from "@/stores/workflows";

import { WorkflowMessageItem } from "./workflow-message";

interface WorkflowTabProps {
  workflow: MovementWorkflow;
}

const STATUS_CONFIG: Record<
  MovementWorkflow["status"],
  { icon: React.ReactNode; label: string; className: string }
> = {
  queued: {
    icon: <Clock className="size-3" />,
    label: "Queued",
    className: "text-muted-foreground",
  },
  running: {
    icon: <Loader2 className="size-3 animate-spin" />,
    label: "Running",
    className: "text-blue-400",
  },
  pending: {
    icon: <PauseCircle className="size-3" />,
    label: "Needs input",
    className: "text-orange-400",
  },
  succeeded: {
    icon: <CheckCircle2 className="size-3" />,
    label: "Done",
    className: "text-indigo-400",
  },
  failed: {
    icon: <XCircle className="size-3" />,
    label: "Failed",
    className: "text-red-400",
  },
  cancelled: {
    icon: <Minus className="size-3" />,
    label: "Cancelled",
    className: "text-muted-foreground",
  },
};

export function WorkflowTab({ workflow }: WorkflowTabProps) {
  const movement = useMovements((state) =>
    state.getMovementById(workflow.movement),
  );
  const mutate = useSync((state) => state.mutate);
  const closeWorkflow = useWorkflows((state) => state.closeWorkflow);
  const minimize = useWorkflows((state) => state.minimize);

  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isPending = workflow.status === "pending";
  const statusConfig = STATUS_CONFIG[workflow.status];

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    const scrollEl = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [workflow.messages.length]);

  const handleAnswer = (content: string, optionId?: string) => {
    mutate({
      name: "answerWorkflow",
      mutation: answerWorkflowMutation,
      variables: {
        id: workflow.id,
        content,
        optionId: optionId ?? undefined,
      },
      rollbackData: undefined,
      events: [
        {
          type: "updateWorkflow",
          payload: {
            id: workflow.id,
            status: "queued",
          },
        },
      ],
    });
    setInput("");
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    handleAnswer(input.trim());
  };

  return (
    <div className="flex h-full flex-col border-t bg-background">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            statusConfig.className,
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
        <div className="text-xs text-muted-foreground">
          {movement?.name ?? workflow.movement}
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={minimize}
        >
          <Minus className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => closeWorkflow(workflow.id)}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-3">
          <AnimatePresence mode="popLayout">
            {workflow.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <WorkflowMessageItem
                  message={message}
                  isPending={isPending && message === workflow.messages.at(-1)}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {workflow.error && (
            <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              {workflow.error}
            </div>
          )}

          {workflow.status === "running" && workflow.messages.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Starting workflow...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t p-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              isPending ? "Type your answer..." : "Waiting for workflow..."
            }
            disabled={!isPending}
            className="max-h-24 min-h-[36px] flex-1 resize-none text-sm"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isPending || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
