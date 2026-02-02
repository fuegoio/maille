import { ComponentExample } from "@/components/component-example";
import { gql } from 'graphql-request';

// Test query to trigger code generation
export const TEST_QUERY = gql`
  query Test {
    activities {
      id
      name
    }
  }
`;

export function App() {
return <ComponentExample />;
}

export default App;