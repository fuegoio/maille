import { defineStore } from "pinia";

import type { Contact } from "@maille/core/contacts";

import type { UUID } from "crypto";
import { useStorage } from "@vueuse/core";

export const useContactsStore = defineStore("contacts", () => {
  const contacts = useStorage<Contact[]>("contacts", []);

  const getContactById = (contactId: UUID): Contact | undefined => {
    return contacts.value.find((a) => a.id === contactId);
  };

  return {
    contacts,
    getContactById,
  };
});
