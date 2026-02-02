// Initial GraphQL query file
import { gql } from 'graphql-request'

export const GET_INITIAL_DATA = gql`
  query InitialData {
    activities {
      id
      name
    }
    accounts {
      id
      name
    }
  }
`
