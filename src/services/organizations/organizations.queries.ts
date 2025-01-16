import { gql } from 'graphql-request';

export const LIST_DAOS_QUERY = gql`
  query Organizations($input: OrganizationsInput!) {
    organizations(input: $input) {
      nodes {
        ... on Organization {
          id
          slug
          name
          chainIds
          tokenIds
          governorIds
          metadata {
            description
            icon
            socials {
              website
              discord
              twitter
            }
          }
          hasActiveProposals
          proposalsCount
          delegatesCount
          delegatesVotesCount
          tokenOwnersCount
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
      tokenIds
      governorIds
      proposalsCount
      tokenOwnersCount
      delegatesCount
      delegatesVotesCount
      hasActiveProposals
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