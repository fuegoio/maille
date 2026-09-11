import { triggerWorkflowMutation } from "@/mutations/workflows";
import { useSync } from "@/stores/sync";
import { useWorkflows } from "@/stores/workflows";

export function useTriggerWorkflow() {
  const mutate = useSync((state) => state.mutate);

  return (movementId: string, message?: string) => {
    useWorkflows.getState().setTriggering(movementId);
    mutate({
      name: "triggerWorkflow",
      mutation: triggerWorkflowMutation,
      variables: {
        movementId,
        message: message?.trim() || undefined,
      },
      rollbackData: undefined,
      events: [],
    });
  };
}
