/**
 * Workflow configuration read at call time. Kept behind an indirection so
 * the enabled-state can change without a process restart (and tests can
 * toggle it); the remaining settings are validated by `env`.
 */

export const isWorkflowsConfigured = (): boolean => Boolean(process.env.MISTRAL_API_KEY);

export const workflowApiKey = (): string => process.env.MISTRAL_API_KEY ?? "";
