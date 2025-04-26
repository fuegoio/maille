import type { ActivityMutation } from "./activities";
import type { MovementMutation } from "./movements";
import type { ProjectMutation } from "./projects";

export type Mutation = ActivityMutation | MovementMutation | ProjectMutation;
