import type { CodegenConfig } from '@graphql-codegen/cli'
 
const config: CodegenConfig = {
   schema: '../api/schema.graphql',
   documents: ['src/**/*.vue', "src/**/*.ts"],
   generates: {
      './src/gql/': {
        preset: 'client',
        config: {
          useTypeImports: true,
        },
      }
   },
   config: {
    scalars: {
      Date: 'string',
    },
    avoidOptionals: {
      field: true,
      inputValue: false,
      object: false,
      defaultValue: false
    },
    skipTypename: true,
  },
}

export default config;
