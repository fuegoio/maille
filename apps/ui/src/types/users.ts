import type { UUID } from "crypto";

export type User = {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
};
