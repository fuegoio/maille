import type {
  WorkflowMessage,
  WorkflowMessageOption,
} from "@maille/core/workflows";

import { Bot, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkflowMessageItemProps {
  message: WorkflowMessage;
  isPending: boolean;
  onAnswer: (content: string, optionId?: string) => void;
}

export function WorkflowMessageItem({
  message,
  isPending,
  onAnswer,
}: WorkflowMessageItemProps) {
  const isAssistant = message.role === "assistant";
  const hasOptions = isAssistant && isPending && message.options?.length;

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/50">
          <Bot className="size-3.5 text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isAssistant
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {message.content}
        </div>

        {hasOptions && (
          <div className="flex flex-col gap-1.5">
            {message.options!.map((option: WorkflowMessageOption) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                className="h-auto justify-start py-1.5 text-xs"
                onClick={() => onAnswer(option.label, option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {!isAssistant && message.optionId && (
          <span className="text-xs text-muted-foreground">
            chosen: {message.optionId}
          </span>
        )}
      </div>
      {!isAssistant && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/30">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
