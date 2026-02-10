import SchemaBuilder from "@pothos/core";
import { DateResolver } from "graphql-scalars";
import type { SessionData } from "./auth";

export interface SchemaTypes {
  DefaultFieldNullability: false;
  DefaultInputFieldRequiredness: true;
  Scalars: {
    Date: { Input: Date; Output: Date };
  };
  Context: SessionData;
}

export type TypesWithDefaults = PothosSchemaTypes.ExtendDefaultTypes<SchemaTypes>;

export const builder = new SchemaBuilder<TypesWithDefaults>({
  defaultFieldNullability: false,
  defaultInputFieldRequiredness: true,
});

builder.addScalarType("Date", DateResolver);
