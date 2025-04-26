import type { UUID } from "crypto";

export type Contact = {
  id: UUID;
  contact: UUID;
  contactEmail: string;
  approved: boolean;
  liabilityAccount: UUID | null;
};
