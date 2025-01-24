import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';
import { AddressGovernancesInput } from './addresses.types.js';
import { getAddress } from 'ethers';

const GET_ADDRESS_GOVERNANCES_QUERY = gql`
  query AddressGovernances($input: DelegatesInput!) {
    delegates(input: $input) {
      nodes {
        ... on Delegate {
          chainId
          votesCount
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
        }
      }
    }
  }
`;

export async function getAddressGovernances(
  client: GraphQLClient,
  input: AddressGovernancesInput
): Promise<Record<string, any>> {

  try {
    const response = await client.request(
      GET_ADDRESS_GOVERNANCES_QUERY,
      {
        input: {
          filters: {
            address: getAddress(input.address)
          }
        }
      }
    ) as Record<string, any>;

    return response;
  } catch (error: any) {
    if (error.response?.status === 422) {
      return { delegates: { nodes: [] } };
    }
    throw new Error(`Failed to fetch address governances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 