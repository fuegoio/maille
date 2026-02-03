import type { UUID } from "crypto";

export type Project = {
  id: UUID;
  name: string;
  emoji: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

export type ProjectStatus = "scheduled" | "in progress" | "completed";
