import { triggerWorkflowMutation } from "@/mutations/workflows";
import { useSync } from "@/stores/sync";

export function useTriggerWorkflow() {
  const mutate = useSync((state) => state.mutate);

  return (movementId: string) => {
    mutate({
      name: "triggerWorkflow",
      mutation: triggerWorkflowMutation,
      variables: {
        movementId,
      },
      rollbackData: undefined,
      events: [],
    });
  };
}
