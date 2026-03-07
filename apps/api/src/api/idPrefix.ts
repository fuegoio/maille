import { GraphQLError } from "graphql";

const MIN_PREFIX_LENGTH = 8;

/**
 * Validates that an ID prefix is at least 8 characters and returns the LIKE pattern.
 * Accepts both full UUIDs and short prefixes (first section of a UUID4).
 */
export function idPattern(prefix: string): string {
  if (prefix.length < MIN_PREFIX_LENGTH) {
    throw new GraphQLError(
      `ID prefix must be at least ${MIN_PREFIX_LENGTH} characters, got ${prefix.length}`,
    );
  }
  return `${prefix}%`;
}
