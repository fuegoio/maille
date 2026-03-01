import { type Transaction } from "@maille/core/activities";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

interface TransactionTemplate {
  id: string;
  name: string;
  transactions: Omit<Transaction, "id">[];
}

interface TemplatesState {
  templates: TransactionTemplate[];

  getTemplateById: (templateId: string) => TransactionTemplate | undefined;
  getTemplates: () => TransactionTemplate[];

  addTemplate: (
    template: Omit<TransactionTemplate, "id">,
  ) => TransactionTemplate;
  updateTemplate: (
    templateId: string,
    update: { name?: string; transactions?: Omit<Transaction, "id">[] },
  ) => void;
  deleteTemplate: (templateId: string) => void;
}

export const useTemplates = create<TemplatesState>()(
  persist(
    (set, get) => ({
      templates: [],

      getTemplateById: (
        templateId: string,
      ): TransactionTemplate | undefined => {
        return get().templates.find((t) => t.id === templateId);
      },

      getTemplates: (): TransactionTemplate[] => {
        return get().templates;
      },

      addTemplate: (template): TransactionTemplate => {
        const newTemplate = {
          ...template,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return newTemplate;
      },

      updateTemplate: (templateId, update) => {
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === templateId) {
              return {
                ...template,
                ...update,
              };
            }
            return template;
          }),
        }));
      },

      deleteTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter(
            (template) => template.id !== templateId,
          ),
        }));
      },
    }),
    {
      name: "transaction-templates",
      storage: storage,
    },
  ),
);
