import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_CREATED_PROPOSALS_QUERY } from './addresses.queries.js';
import { AddressCreatedProposalsInput, AddressCreatedProposalsResponse } from './addresses.types.js';

export async function getAddressCreatedProposals(
  client: GraphQLClient,
  input: AddressCreatedProposalsInput
): Promise<AddressCreatedProposalsResponse> {
  try {
    if (!input.address) {
      throw new Error('address is required to fetch created proposals');
    }

    const response = await client.request<AddressCreatedProposalsResponse>(GET_ADDRESS_CREATED_PROPOSALS_QUERY, {
      input: {
        filters: {
          proposer: input.address
        },
        pagination: {
          limit: Math.min(input.limit || 20, 50),
          afterCursor: input.afterCursor,
          beforeCursor: input.beforeCursor
        }
      }
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch created proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 