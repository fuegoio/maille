import type { UUID } from "crypto";

export type User = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};
