import { type Contact } from "@maille/core/contacts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

interface ContactsState {
  contacts: Contact[];
  getContactById: (contactId: string) => Contact | undefined;
  addContact: (contact: Contact) => void;
  updateContact: (contactId: string, update: Partial<Contact>) => void;
  deleteContact: (contactId: string) => void;
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
    }),
    {
      name: "contacts",
      storage: storage,
    },
  ),
);

