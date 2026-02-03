import type { User } from "#users/types.js";
import type { UUID } from "crypto";

export interface Workspace {
  id: UUID;
  name: string;
  startingDate: Date;
  currency: string;
  createdAt: string;
  users?: Array<User>;
}
