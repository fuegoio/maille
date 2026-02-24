import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Session, User } from "@/lib/auth";

import { storage } from "./storage";

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User, session: Session) => void;
  updateUser: (update: Partial<User>) => void;
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
      updateUser: (update) => {
        const updateFieldWithoutUndefined = Object.fromEntries(
          Object.entries(update).filter(([_, value]) => value !== undefined),
        );
        const user = useAuth.getState().user;
        if (!user) return;

        set({
          user: {
            ...user,
            ...updateFieldWithoutUndefined,
          },
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
