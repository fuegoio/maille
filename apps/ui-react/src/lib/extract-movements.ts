import { ClientError } from "graphql-request";

import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";

export type ExtractedMovement = {
  name: string;
  date: string;
  amount: number;
};

export type ExtractionResult = {
  movements: ExtractedMovement[];
  dropped: number;
};

const extractMovementsMutation = graphql(/* GraphQL */ `
  mutation ExtractMovements($text: String!) {
    extractMovements(text: $text) {
      movements {
        name
        date
        amount
      }
      dropped
    }
  }
`);

/**
 * Runs the AI extraction on the API. Raises the server's error message
 * (e.g. missing configuration, text too long, provider failure) verbatim:
 * self-hosters act on it directly.
 */
export async function extractMovementsFromText(
  text: string,
): Promise<ExtractionResult> {
  try {
    const result = await graphqlClient.request(extractMovementsMutation, {
      text,
    });
    return result.extractMovements;
  } catch (error) {
    if (error instanceof ClientError) {
      throw new Error(
        error.response.errors?.[0]?.message ??
          "The extraction failed. Try again.",
      );
    }
    throw error;
  }
}
