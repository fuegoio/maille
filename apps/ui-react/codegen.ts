import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../api/schema.graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts"],
  generates: {
    "./src/gql/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
      config: {
        useTypeImports: true,
        documentMode: "documentNode",
        dedupeFragments: true,
      },
    },
  },
  config: {
    scalars: {
      Date: "string",
    },
    avoidOptionals: {
      field: true,
      inputValue: false,
      object: false,
      defaultValue: false,
    },
    skipTypename: true,
    enumsAsTypes: true,
  },
};

export default config;
