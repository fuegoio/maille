import type { ReactNode } from "react";

import { create } from "zustand";

/**
 * Breadcrumb navigation framework.
 *
 * Pages declare their breadcrumb chain with `usePageBreadcrumbs`, which
 * commits it to this store. Detail pages that can be reached from several
 * places (movements, activities, counterparties) are *contextual*: instead of
 * a fixed chain, their trail is `captured context + own entry`. The context
 * is captured at click time by `ContextLink`/`useContextNavigate` — it never
 * touches the URL — and is remembered per history entry so browser
 * back/forward restore the right trail.
 */

export interface BreadcrumbTarget {
  to: string;
  params?: Record<string, string | undefined>;
  search?: Record<string, unknown>;
}

export interface BreadcrumbEntry {
  /** Stable identity of the crumb, e.g. "account:<id>". */
  key: string;
  label: ReactNode;
  /** Absent on the crumb for the current page. */
  target?: BreadcrumbTarget;
  /** Tooltip when the label is truncated. */
  title?: string;
}

/** Page whose chain is fully derived from URL + client state. */
export interface StaticBreadcrumbsPage {
  contextual: false;
  routeKey: string;
  entries: BreadcrumbEntry[];
}

/**
 * Page whose chain depends on how it was reached. `fallback` is the chain
 * used on direct entry (deep link, refresh); with a captured context the
 * trail becomes `context + own entry`.
 */
export interface ContextualBreadcrumbsPage {
  contextual: true;
  routeKey: string;
  own: BreadcrumbEntry;
  fallback: BreadcrumbEntry[];
}

export type BreadcrumbsPage = StaticBreadcrumbsPage | ContextualBreadcrumbsPage;

interface CommittedTrail {
  /** Route pattern of the page that committed, e.g. "/movements/$id". */
  routeKey: string;
  /** Ancestor crumbs of a contextual page, null when it fell back. */
  context: BreadcrumbEntry[] | null;
  /** Full rendered trail of the current page. */
  entries: BreadcrumbEntry[];
}

interface BreadcrumbsState {
  trail: CommittedTrail | null;
  /** Context captured by a context-aware link, awaiting consumption. */
  pending: { routeKey: string; context: BreadcrumbEntry[] } | null;
  /** Saved contexts per history entry key, for back/forward restoration. */
  contexts: Map<string, BreadcrumbEntry[]>;
}

const MAX_SAVED_CONTEXTS = 50;

const initialState: BreadcrumbsState = {
  trail: null,
  pending: null,
  contexts: new Map(),
};

export const useBreadcrumbsStore = create<BreadcrumbsState>(() => initialState);

export function getBreadcrumbsState(): BreadcrumbsState {
  return useBreadcrumbsStore.getState();
}

/** Snapshot the current trail as context for a page about to be opened. */
export function captureBreadcrumbContext(routeKey: string): void {
  const { trail } = useBreadcrumbsStore.getState();
  if (!trail) {
    return;
  }
  useBreadcrumbsStore.setState({
    pending: { routeKey, context: trail.entries },
  });
}

function rememberContext(
  state: BreadcrumbsState,
  entryKey: string,
  context: BreadcrumbEntry[],
): void {
  if (state.contexts.has(entryKey)) {
    return;
  }
  const contexts = new Map(state.contexts);
  contexts.set(entryKey, context);
  while (contexts.size > MAX_SAVED_CONTEXTS) {
    const oldest = contexts.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    contexts.delete(oldest);
  }
  useBreadcrumbsStore.setState({ contexts });
}

/**
 * Resolve the parent context of a contextual page, in priority order:
 * 1. context remembered for this history entry (back/forward restoration),
 * 2. context of the previously committed page of the same route (navigating
 *    between two movements keeps the trail, e.g. prev/next hotkeys),
 * 3. context captured by the link that opened this page,
 * 4. nothing — the page falls back to its default chain.
 */
function resolveContext(
  routeKey: string,
  entryKey: string | undefined,
  state: BreadcrumbsState,
): { context: BreadcrumbEntry[] | null; fromPending: boolean } {
  if (entryKey && state.contexts.has(entryKey)) {
    return { context: state.contexts.get(entryKey)!, fromPending: false };
  }
  if (state.trail?.routeKey === routeKey) {
    return { context: state.trail.context, fromPending: false };
  }
  if (state.pending?.routeKey === routeKey) {
    return { context: state.pending.context, fromPending: true };
  }
  return { context: null, fromPending: false };
}

/** Pure resolution of a page's rendered trail against the current state. */
export function resolveBreadcrumbs(
  page: BreadcrumbsPage,
  entryKey: string | undefined,
  state: BreadcrumbsState = useBreadcrumbsStore.getState(),
): { context: BreadcrumbEntry[] | null; entries: BreadcrumbEntry[] } {
  if (!page.contextual) {
    return { context: null, entries: page.entries };
  }
  const { context } = resolveContext(page.routeKey, entryKey, state);
  const parents = context ?? page.fallback;
  return { context, entries: [...parents, page.own] };
}

/**
 * Commit a page's trail. Called from an effect in `usePageBreadcrumbs`, so
 * it runs once per page (re-)mount rather than during render.
 */
export function commitBreadcrumbs(
  page: BreadcrumbsPage,
  entryKey: string | undefined,
): void {
  const state = useBreadcrumbsStore.getState();
  const { context, entries } = resolveBreadcrumbs(page, entryKey, state);

  // The commit effect runs on every render of a page, including renders
  // that happen while navigating away: the router keeps the source page
  // mounted until the target route is ready, and that re-commit would drop
  // the context just captured by the link opening the target page. A
  // commit from the page already recorded in `trail` is a re-render, not a
  // navigation; only a commit from a different page makes `pending` stale.
  const reCommit = state.trail?.routeKey === page.routeKey;

  useBreadcrumbsStore.setState({
    trail: { routeKey: page.routeKey, context, entries },
    pending: reCommit ? state.pending : null,
  });

  if (page.contextual && context && entryKey) {
    rememberContext(state, entryKey, context);
  }
}

export function resetBreadcrumbs(): void {
  useBreadcrumbsStore.setState(initialState);
}
