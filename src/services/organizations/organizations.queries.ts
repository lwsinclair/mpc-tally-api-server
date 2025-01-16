import { gql } from 'graphql-request';

export const LIST_DAOS_QUERY = gql`
  query Organizations($input: OrganizationsInput!) {
    organizations(input: $input) {
      nodes {
        ... on Organization {
          id
          name
          slug
          chainIds
          proposalsCount
          hasActiveProposals
          tokenOwnersCount
          delegatesCount
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export const GET_DAO_QUERY = gql`
  query GetOrganization($input: OrganizationInput!) {
    organization(input: $input) {
      id
      name
      slug
      chainIds
      proposalsCount
      tokenOwnersCount
      delegatesCount
      metadata {
        description
        icon
        socials {
          website
          discord
          twitter
        }
      }
    }
  }
`; 