import type { View, ViewConfig, ViewScope } from "@maille/core/views";

import { serializeViewScope } from "@maille/core/views";

import {
  createViewMutation,
  deleteViewMutation,
  updateViewMutation,
} from "@/mutations/views";
import { useSync } from "@/stores/sync";

/**
 * The view mutations, wired to the sync queue: every change applies
 * optimistically through its event and rolls back on failure.
 */
export function useViewMutations() {
  const mutate = useSync((state) => state.mutate);

  const createView = (params: {
    name: string;
    scope: ViewScope;
    config: ViewConfig;
  }): string => {
    const id = crypto.randomUUID();
    const scope = serializeViewScope(params.scope);
    const config = JSON.stringify(params.config);
    mutate({
      name: "createView",
      mutation: createViewMutation,
      variables: {
        id,
        name: params.name,
        scope,
        resource: params.config.resource,
        config,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createView",
          payload: {
            id,
            name: params.name,
            scope,
            resource: params.config.resource,
            config,
          },
        },
      ],
    });
    return id;
  };

  const updateViewConfig = (view: View, config: ViewConfig) => {
    mutate({
      name: "updateView",
      mutation: updateViewMutation,
      variables: { id: view.id, config: JSON.stringify(config) },
      rollbackData: { config: JSON.stringify(view.config) },
      events: [
        {
          type: "updateView",
          payload: { id: view.id, config: JSON.stringify(config) },
        },
      ],
    });
  };

  const renameView = (view: View, name: string) => {
    mutate({
      name: "updateView",
      mutation: updateViewMutation,
      variables: { id: view.id, name },
      rollbackData: { name: view.name },
      events: [{ type: "updateView", payload: { id: view.id, name } }],
    });
  };

  const deleteView = (view: View) => {
    mutate({
      name: "deleteView",
      mutation: deleteViewMutation,
      variables: { id: view.id },
      rollbackData: view,
      events: [{ type: "deleteView", payload: { id: view.id } }],
    });
  };

  return { createView, updateViewConfig, renameView, deleteView };
}
