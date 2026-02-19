import type { User, Session } from "better-auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User, session: Session) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user, session) => {
        set({
          user,
          session,
        });
      },
      clear: () => {
        set({
          user: null,
          session: null,
        });
      },
    }),
    {
      name: "auth",
      storage: storage,
    },
  ),
);
