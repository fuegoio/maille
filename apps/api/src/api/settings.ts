import { builder } from "@/api/builder";
import type { Settings } from "@maille/core/settings";

import configData from "@/../config.json";

export const SettingsSchema = builder.objectRef<Settings>("Settings");

SettingsSchema.implement({
  fields: (t) => ({
    startingPeriod: t.exposeString("startingPeriod"),
    currency: t.exposeString("currency"),
  }),
});

export const registerSettingsQueries = () => {
  builder.queryField("settings", (t) =>
    t.field({
      type: SettingsSchema,
      resolve: async (root, args, ctx) => {
        return configData;
      },
    }),
  );
};
