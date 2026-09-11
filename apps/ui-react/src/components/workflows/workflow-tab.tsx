import type { MovementWorkflow } from "@maille/core/workflows";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Minus, Sparkles, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useTriggerWorkflow } from "@/hooks/use-trigger-workflow";
import { cn } from "@/lib/utils";
import { answerWorkflowMutation } from "@/mutations/workflows";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";
import { useWorkflows } from "@/stores/workflows";

import { WorkflowMessageItem } from "./workflow-message";
import { WORKFLOW_STATUS_CONFIG } from "./workflow-status";

interface WorkflowTabProps {
  workflow: MovementWorkflow;
}

export function WorkflowTab({ workflow }: WorkflowTabProps) {
  const movement = useMovements((state) =>
    state.getMovementById(workflow.movement),
  );
  const mutate = useSync((state) => state.mutate);
  const closeWorkflow = useWorkflows((state) => state.closeWorkflow);
  const minimize = useWorkflows((state) => state.minimize);
  const triggerWorkflow = useTriggerWorkflow();
  const isTriggering = useWorkflows((state) =>
    state.triggeringMovementIds.includes(workflow.movement),
  );

  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isPending = workflow.status === "pending";
  const isTerminal =
    workflow.status === "succeeded" ||
    workflow.status === "failed" ||
    workflow.status === "cancelled";
  const statusConfig = WORKFLOW_STATUS_CONFIG[workflow.status];
  const isReconciled = movement?.status === "completed";

  // The input answers the workflow's question while pending, continues the
  // conversation once the movement is reconciled, and is sent as a hint when
  // retrying a terminal workflow.
  const canAnswer = isPending || (isTerminal && isReconciled);
  const canRetry = isTerminal && !isReconciled;

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

  const handleRetry = () => {
    triggerWorkflow(workflow.movement, input);
    setInput("");
  };

  const handleSubmit = () => {
    if (!canAnswer || !input.trim()) return;
    handleAnswer(input.trim());
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            statusConfig.dotClass,
            workflow.status === "running" && "animate-pulse",
          )}
        />
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
            {workflow.messages.map((message) => {
              if (message.role === "separator") {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 py-1"
                  >
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[0.65rem] text-muted-foreground">
                      New session
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </motion.div>
                );
              }
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <WorkflowMessageItem
                    message={message}
                    isPending={
                      isPending && message === workflow.messages.at(-1)
                    }
                    onAnswer={handleAnswer}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {workflow.error && (
            <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              {workflow.error}
            </div>
          )}

          {/* Loading / thinking indicators */}
          {workflow.status === "queued" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
              Waiting to start...
            </div>
          )}

          {workflow.status === "running" && workflow.messages.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 animate-pulse rounded-full",
                  statusConfig.dotClass,
                )}
              />
              Starting workflow...
            </div>
          )}

          {workflow.status === "running" && workflow.messages.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/50">
                <Bot className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-muted-foreground/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input / action bar */}
      <div className="flex shrink-0 items-end gap-2 border-t p-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canRetry) {
                handleRetry();
              } else {
                handleSubmit();
              }
            }
          }}
          placeholder="Type a message..."
          className="max-h-24 min-h-[36px] flex-1 resize-none text-sm"
          rows={1}
        />
        {canRetry ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isTriggering}
            className="h-9 gap-1.5"
          >
            {isTriggering ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {isTriggering
              ? "Starting..."
              : workflow.status === "succeeded"
                ? "Start new"
                : "Retry"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canAnswer || !input.trim()}
            className="h-9"
          >
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
