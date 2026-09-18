import type { SyncEvent } from "@maille/core/sync";
import type { View } from "@maille/core/views";

import { parseViewConfig } from "@maille/core/views";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

/** A createView event's payload, with the config as a JSON string. */
function viewFromEventPayload(payload: {
  id: string;
  name: string;
  scope: string;
  resource: View["config"]["resource"];
  config: string;
  createdAt?: string;
}): View {
  return {
    id: payload.id,
    name: payload.name,
    scope: payload.scope,
    config: parseViewConfig(
      payload.resource,
      JSON.parse(payload.config) as unknown,
    ),
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };
}

interface CustomViewsState {
  views: View[];

  setViews: (views: View[]) => void;
  getScopeViews: (scope: string) => View[];

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: Mutation) => void;
  handleMutationError: (event: Mutation) => void;
}

export const useCustomViews = create<CustomViewsState>()(
  persist(
    (set, get) => ({
      views: [],

      setViews: (views) => set({ views }),

      getScopeViews: (scope) =>
        get().views.filter((view) => view.scope === scope),

      handleEvent: (event) => {
        if (event.type === "createView") {
          if (get().views.some((view) => view.id === event.payload.id)) return;
          set({ views: [...get().views, viewFromEventPayload(event.payload)] });
        } else if (event.type === "updateView") {
          set({
            views: get().views.map((view) => {
              if (view.id !== event.payload.id) return view;
              return {
                ...view,
                name: event.payload.name ?? view.name,
                config:
                  event.payload.config === undefined
                    ? view.config
                    : parseViewConfig(
                        view.config.resource,
                        JSON.parse(event.payload.config) as unknown,
                      ),
              };
            }),
          });
        } else if (event.type === "deleteView") {
          set({
            views: get().views.filter((view) => view.id !== event.payload.id),
          });
        } else if (
          event.type === "deleteActivityCategory" ||
          event.type === "deleteActivitySubCategory"
        ) {
          // Keep view filters valid when the filtered entity disappears.
          const { id } = event.payload;
          const field =
            event.type === "deleteActivityCategory"
              ? "category"
              : "subcategory";
          set({
            views: get().views.map((view) =>
              view.config.resource === "activities"
                ? {
                    ...view,
                    config: {
                      ...view.config,
                      filters: view.config.filters.map((filter) =>
                        filter.field === field && filter.value !== undefined
                          ? {
                              ...filter,
                              value: filter.value.filter((v) => v !== id),
                            }
                          : filter,
                      ),
                    },
                  }
                : view,
            ),
          });
        }
      },

      handleMutationSuccess: (mutation) => {
        if (!mutation.result) return;
      },

      handleMutationError: (mutation) => {
        if (mutation.name === "createView") {
          set({
            views: get().views.filter(
              (view) => view.id !== mutation.variables.id,
            ),
          });
        } else if (mutation.name === "updateView") {
          const rollback = mutation.rollbackData as
            | { name?: string; config?: string }
            | undefined;
          if (!rollback) return;
          set({
            views: get().views.map((view) =>
              view.id === mutation.variables.id
                ? {
                    ...view,
                    name: rollback.name ?? view.name,
                    config: rollback.config
                      ? parseViewConfig(
                          view.config.resource,
                          JSON.parse(rollback.config) as unknown,
                        )
                      : view.config,
                  }
                : view,
            ),
          });
        } else if (mutation.name === "deleteView") {
          const rollback = mutation.rollbackData as View | undefined;
          if (!rollback) return;
          set({
            views: [
              ...get().views.filter(
                (view) => view.id !== mutation.variables.id,
              ),
              rollback,
            ],
          });
        }
      },
    }),
    {
      name: "customViews",
      storage,
    },
  ),
);
