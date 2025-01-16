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
            color
            description
            icon
          }
          creator {
            id
            address
            ens
            twitter
            name
            bio
            picture
            safes
            type
            votes
            proposalsCreatedCount
          }
          hasActiveProposals
          proposalsCount
          delegatesCount
          delegatesVotesCount
          tokenOwnersCount
          endorsementService {
            id
            competencyFields {
              id
              name
              description
            }
          }
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