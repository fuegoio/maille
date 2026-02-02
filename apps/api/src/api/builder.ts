import type { UUID } from "crypto";
import SchemaBuilder from "@pothos/core";
import { DateResolver, UUIDResolver } from "graphql-scalars";
import type { SessionData } from "./auth";

export interface SchemaTypes {
  DefaultFieldNullability: false;
  DefaultInputFieldRequiredness: true;
  Scalars: {
    UUID: { Input: UUID; Output: UUID };
    Date: { Input: Date; Output: Date };
  };
  Context: SessionData;
}

export type TypesWithDefaults =
  PothosSchemaTypes.ExtendDefaultTypes<SchemaTypes>;

export const builder = new SchemaBuilder<TypesWithDefaults>({
  defaultFieldNullability: false,
  defaultInputFieldRequiredness: true,
});

builder.addScalarType("UUID", UUIDResolver);
builder.addScalarType("Date", DateResolver);
