import { createStore } from "zustand";
import type { Mutation } from "@/mutations";

interface EventsState {
  sendEvent: (event: { name: string; mutation: any; variables: any; rollbackData?: any }) => void;
}

export const eventsStore = createStore<EventsState>()((set, get) => ({
  sendEvent: (event) => {
    console.log("Event sent:", event);
    // This would typically be handled by a more complex event system
    // For now, we'll just log it
  },
}));
