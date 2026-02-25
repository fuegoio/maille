import { type Contact } from "@maille/core/contacts";
import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface ContactsState {
  contacts: Contact[];
  getContactById: (contactId: string) => Contact | undefined;
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, update: Partial<Contact>) => void;
  deleteContact: (contactId: string) => void;
  restoreContact: (contact: Contact) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const useContacts = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],

      getContactById: (contactId: string): Contact | undefined => {
        return get().contacts.find((c) => c.id === contactId);
      },

      addContact: (contact) => {
        set((state) => ({
          contacts: [...state.contacts, contact],
        }));
      },

      updateContact: (contactId, update) => {
        set((state) => ({
          contacts: state.contacts.map((contact) => {
            if (contact.id === contactId) {
              return {
                ...contact,
                ...update,
              };
            }
            return contact;
          }),
        }));
      },

      deleteContact: (contactId: string) => {
        set((state) => ({
          contacts: state.contacts.filter(
            (contact) => contact.id !== contactId,
          ),
        }));
      },

      restoreContact: (contact: Contact) => {
        set((state) => ({
          contacts: [...state.contacts, contact],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createContact") {
          get().addContact({
            ...event.payload,
            createdAt: new Date(),
          });
        } else if (event.type === "deleteContact") {
          get().deleteContact(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "deleteContact") {
          get().restoreContact({
            ...event.rollbackData,
            createdAt: new Date(event.rollbackData.createdAt),
          });
        }
      },
    }),
    {
      name: "contacts",
      storage: storage,
    },
  ),
);
