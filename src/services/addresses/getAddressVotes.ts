import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput, AddressVotesResponse } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import {
  TallyAPIError,
  ValidationError
} from '../errors/apiErrors.js';

export async function getAddressVotes(
  client: GraphQLClient,
  input: AddressVotesInput
): Promise<AddressVotesResponse> {
  try {
    if (!input.address) {
      throw new ValidationError('address is required');
    }

    if (!input.organizationSlug) {
      throw new ValidationError('organizationSlug is required');
    }

    // Step 1: Get the organization
    await globalRateLimiter.waitForRateLimit();
    const dao = await getDAO(client, input.organizationSlug);

    // Step 2: Make the votes request
    await globalRateLimiter.waitForRateLimit();
    const response = await client.request<{ votes: { nodes: any[]; pageInfo: any } }>(GET_ADDRESS_VOTES_QUERY, {
      input: {
        filters: {
          voter: input.address,
          governorIds: dao.governorIds
        },
        pagination: {
          limit: input.limit || 20,
          afterCursor: input.afterCursor
        }
      }
    });

    return {
      votes: {
        nodes: response.votes?.nodes.map(vote => ({
          id: vote.id,
          type: vote.support === 1 ? 'for' : vote.support === 0 ? 'against' : 'abstain',
          amount: vote.weight,
          reason: vote.reason,
          voter: vote.voter,
          proposal: vote.proposal
        })) || [],
        pageInfo: response.votes?.pageInfo || {
          firstCursor: '',
          lastCursor: ''
        }
      }
    };
  } catch (error) {
    throw new TallyAPIError(`Failed to fetch address votes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 