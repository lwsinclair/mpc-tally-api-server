import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_PROPOSALS_QUERY } from './addresses.queries.js';
import type { AddressProposalsInput, AddressProposalsResponse } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { globalRateLimiter } from '../../services/utils/rateLimiter.js';

export async function getAddressProposals(
  client: GraphQLClient,
  input: AddressProposalsInput
): Promise<AddressProposalsResponse> {
  try {
    await globalRateLimiter.waitForRateLimit();
    const { organization: dao } = await getDAO(client, 'uniswap');

    const response = await client.request<AddressProposalsResponse>(GET_ADDRESS_PROPOSALS_QUERY, {
      input: {
        filters: {
          proposer: input.address,
          organizationId: dao.id,
        },
        page: {
          limit: Math.min(input.limit || 20, 50),
          afterCursor: input.afterCursor,
          beforeCursor: input.beforeCursor,
        },
      },
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch address proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 