import type { PersistStorage } from "zustand/middleware";

import superjson from "superjson";

export const storage: PersistStorage<unknown> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return superjson.parse(str);
  },
  setItem: (name, value) => {
    localStorage.setItem(name, superjson.stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

/**
 * Set by store migrations when the persisted schema was behind the running
 * code. Consumed once by the authenticated layout, which refetches user data
 * so entities pick up fields the stale local state predates.
 */
export const migrationFlags = { refetchUserData: false };
