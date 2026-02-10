import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "better-auth";
import { storage } from "./storage";

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User, session: Session) => void;
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
    }),
    {
      name: "auth",
      storage: storage,
    },
  ),
);
