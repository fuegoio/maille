import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

/**
 * The side panels a surface can host, in the toggle cluster's order.
 * Panel state is keyed by the surface's view id, so each tab keeps its
 * own drawer: switching tabs never carries a panel over.
 */
export type SidePanelKind = "filter" | "settings" | "analytics" | "summary";

export type SidePanelState = {
  panel: SidePanelKind | null;
  fullView: boolean;
};

interface PanelsState {
  panels: Record<string, SidePanelState>;

  /** The view's panel state, or the default when none is stored yet. */
  getPanel: (
    viewId: string,
    defaultPanel: SidePanelKind | null,
  ) => SidePanelState;
  /** Opens the panel, or closes it when it is already the active one. */
  togglePanel: (
    viewId: string,
    panel: SidePanelKind,
    defaultPanel: SidePanelKind | null,
  ) => void;
  closePanel: (viewId: string) => void;
  setFullView: (viewId: string, fullView: boolean) => void;
}

const CLOSED_PANEL: SidePanelState = { panel: null, fullView: false };

// Stable references per default panel: selectors returning these must
// hit referential equality across renders, or zustand re-renders forever.
const DEFAULT_PANEL_STATES = new Map<SidePanelKind | null, SidePanelState>();

function defaultPanelState(panel: SidePanelKind | null): SidePanelState {
  let state = DEFAULT_PANEL_STATES.get(panel);
  if (!state) {
    state = { panel, fullView: false };
    DEFAULT_PANEL_STATES.set(panel, state);
  }
  return state;
}

export const usePanels = create<PanelsState>()(
  persist(
    (set, get) => ({
      panels: {},

      getPanel: (viewId, defaultPanel) => {
        return get().panels[viewId] ?? defaultPanelState(defaultPanel);
      },

      togglePanel: (viewId, panel, defaultPanel) => {
        const current = get().panels[viewId] ?? defaultPanelState(defaultPanel);

        set((state) => ({
          panels: {
            ...state.panels,
            [viewId]:
              current.panel === panel
                ? CLOSED_PANEL
                : { panel, fullView: false },
          },
        }));
      },

      closePanel: (viewId) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [viewId]: { ...CLOSED_PANEL, fullView: false },
          },
        }));
      },

      setFullView: (viewId, fullView) => {
        set((state) => {
          const current = state.panels[viewId];
          if (!current || !current.panel) return state;

          return {
            panels: {
              ...state.panels,
              [viewId]: { ...current, fullView },
            },
          };
        });
      },
    }),
    {
      name: "panels",
      storage: storage,
    },
  ),
);
