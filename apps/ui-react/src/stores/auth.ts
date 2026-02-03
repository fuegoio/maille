import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "better-auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User, session: Session) => void;
}

export const authStore = createStore<AuthState>()(
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
    }),
    {
      name: "auth",
    },
  ),
);
