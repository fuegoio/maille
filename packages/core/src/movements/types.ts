import type { UUID } from "crypto";
import type dayjs from "dayjs";

export type Movement = {
  id: UUID;
  date: dayjs.Dayjs;
  amount: number;
  account: UUID;
  name: string;
  activities: MovementActivity[];
  status: "incomplete" | "completed";
};

export type MovementActivity = {
  id: UUID;
  activity: UUID;
  amount: number;
};

export type MovementWithLink = Movement & {
  movementActivityId: UUID;
  amountLinked: number;
};
