import type { AccountMutation } from "./accounts";
import type { ActivityMutation } from "./activities";
import type { AssetMutation } from "./assets";
import type { MovementMutation } from "./movements";
import type { ProjectMutation } from "./projects";

export type Mutation =
  | ActivityMutation
  | MovementMutation
  | ProjectMutation
  | AccountMutation
  | AssetMutation;
