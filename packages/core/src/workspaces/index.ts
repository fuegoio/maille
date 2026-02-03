import type { User } from "#users/types.js";

export interface Workspace {
  id: string;
  name: string;
  startingDate: Date;
  currency: string;
  createdAt: string;
  users?: Array<User>;
}
