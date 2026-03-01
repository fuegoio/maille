import type { ActivityType } from "@maille/core/activities";

export type ActivitiesFilters = {
  activityType?: ActivityType;
  category?: string;
  subcategory?: string;
};
