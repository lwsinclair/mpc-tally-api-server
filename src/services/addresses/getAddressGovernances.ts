import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';
import { AddressGovernancesInput } from './addresses.types.js';

const GET_ADDRESS_GOVERNANCES_QUERY = gql`
  query AddressGovernancesDelegatees($input: DelegationsInput!) {
    delegatees(input: $input) {
      nodes {
        ... on Delegation {
          chainId
          organization {
            id
            name
            slug
            metadata {
              icon
            }
            delegatesVotesCount
          }
          token {
            id
            name
            symbol
            decimals
            supply
          }
          votes
        }
      }
    }
  }
`;

export async function getAddressGovernances(
  client: GraphQLClient,
  input: AddressGovernancesInput
): Promise<Record<string, any>> {
  if (!input.address) {
    throw new Error('Address is required');
  }

  try {
    const response = await client.request(
      GET_ADDRESS_GOVERNANCES_QUERY,
      {
        input: {
          filters: {
            address: input.address.toLowerCase()
          }
        }
      }
    ) as Record<string, any>;

    return response;
  } catch (error: any) {
    if (error.response?.status === 422) {
      return { delegatees: { nodes: [] } };
    }
    throw new Error(`Failed to fetch address governances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 