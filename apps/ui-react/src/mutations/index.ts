import type { AccountMutation } from "./accounts";
import type { ActivityMutation } from "./activities";
import type { AssetMutation } from "./assets";
import type { ContactMutation } from "./contacts";
import type { CounterpartyMutation } from "./counterparties";
import type { AssetDepreciationMutation } from "./depreciations";
import type { FundMutation } from "./funds";
import type { MovementMutation } from "./movements";
import type { ProjectMutation } from "./projects";
import type { ViewMutation } from "./views";
import type { WorkflowMutation } from "./workflows";

export type Mutation =
  | ActivityMutation
  | MovementMutation
  | ProjectMutation
  | AccountMutation
  | AssetMutation
  | AssetDepreciationMutation
  | CounterpartyMutation
  | ContactMutation
  | FundMutation
  | WorkflowMutation
  | ViewMutation;
