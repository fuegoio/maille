import type { UUID } from "crypto";
import type dayjs from "dayjs";

export type Project = {
  id: UUID;
  name: string;
  emoji: string | null;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
};

export type ProjectStatus = "scheduled" | "in progress" | "completed";
