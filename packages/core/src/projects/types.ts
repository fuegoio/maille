// Remove incorrect crypto import

export type Project = {
  id: string;
  name: string;
  emoji: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

export type ProjectStatus = "scheduled" | "in progress" | "completed";
