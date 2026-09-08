import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Bot, Sparkles, User } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useTriggerWorkflow } from "@/hooks/use-trigger-workflow";
import { cn } from "@/lib/utils";
import { useWorkflows } from "@/stores/workflows";

import { WorkflowStatusBadge } from "./workflow-status";

interface WorkflowSectionProps {
  movementId: string;
}

export function WorkflowSection({ movementId }: WorkflowSectionProps) {
  const workflow = useWorkflows((state) =>
    state.getWorkflowByMovement(movementId),
  );
  const triggerWorkflow = useTriggerWorkflow();
  const openWorkflow = useWorkflows((state) => state.openWorkflow);

  const isTerminal =
    workflow?.status === "succeeded" ||
    workflow?.status === "failed" ||
    workflow?.status === "cancelled";

  const isIdle =
    workflow?.status === "queued" || workflow?.status === "running";

  // Show up to 2 recent messages as preview
  const previewMessages = React.useMemo(() => {
    if (!workflow || workflow.messages.length === 0) return [];
    return workflow.messages.slice(-2);
  }, [workflow]);

  const lastMessageTime = workflow?.messages.at(-1)?.createdAt;

  const handleTrigger = () => triggerWorkflow(movementId);
  const handleOpen = () => workflow && openWorkflow(workflow.id);

  // Empty state: no workflow yet
  if (!workflow) {
    return (
      <div className="border-t px-4 py-6 sm:px-8">
        <SectionHeader />
        <div className="mt-3 flex items-center justify-between rounded-lg border border-dashed py-4 pr-3 pl-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted">
              <Sparkles className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm text-foreground">No workflow started</div>
              <div className="text-xs text-muted-foreground">
                Let the assistant reconcile this movement
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleTrigger}>
            <Sparkles className="size-3.5" />
            Create activity
          </Button>
        </div>
      </div>
    );
  }

  // Workflow exists — show status, preview, and action
  return (
    <div className="border-t px-4 py-6 sm:px-8">
      <SectionHeader />

      <div className="mt-3 rounded-lg border">
        {/* Status row */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <WorkflowStatusBadge status={workflow.status} />
          {workflow.trigger === "manual" && (
            <span className="text-xs text-muted-foreground">manual</span>
          )}
          {workflow.attempts > 1 && (
            <span className="text-xs text-muted-foreground">
              attempt {workflow.attempts}
            </span>
          )}
          <div className="flex-1" />
          {lastMessageTime && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatDistanceToNow(new Date(lastMessageTime), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>

        {/* Message preview / conversation state */}
        <div className="px-3 py-2.5">
          {workflow.error && (
            <div className="mb-2 rounded bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
              {workflow.error}
            </div>
          )}

          {previewMessages.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isIdle ? (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  Waiting to start...
                </>
              ) : (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  No messages yet
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {previewMessages.map((message) => {
                const isAssistant = message.role === "assistant";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      isAssistant ? "" : "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded",
                        isAssistant
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {isAssistant ? (
                        <Bot className="size-2.5" />
                      ) : (
                        <User className="size-2.5" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "min-w-0 flex-1 text-xs leading-relaxed",
                        isAssistant
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {message.content}
                    </p>
                  </div>
                );
              })}
              {workflow.messages.length > 2 && (
                <div className="pt-0.5 text-xs text-muted-foreground">
                  +{workflow.messages.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 border-t px-3 py-2">
          {workflow.status === "pending" && (
            <Button size="sm" onClick={handleOpen} className="gap-1.5">
              Answer question
              <ArrowRight className="size-3.5" />
            </Button>
          )}

          {isIdle && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpen}
              className="gap-1.5"
            >
              Open conversation
              <ArrowRight className="size-3.5" />
            </Button>
          )}

          {isTerminal && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpen}
                className="gap-1.5"
              >
                View conversation
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTrigger}
                className="gap-1.5"
              >
                <Sparkles className="size-3.5" />
                {workflow.status === "succeeded" ? "Start new" : "Retry"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-1.5">
      <Sparkles className="size-3.5 text-muted-foreground" />
      <span className="text-sm font-medium">Agentic</span>
    </div>
  );
}
