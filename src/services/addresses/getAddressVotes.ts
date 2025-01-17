import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { listProposals } from '../proposals/listProposals.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { TallyAPIError, ValidationError } from '../errors/apiErrors.js';

export async function getAddressVotes(
  client: GraphQLClient,
  input: AddressVotesInput
): Promise<any> {
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

    // Step 2: Get proposals for this organization
    await globalRateLimiter.waitForRateLimit();
    const proposals = await listProposals(client, {
      filters: {
        organizationId: dao.id
      },
      page: {
        limit: 1
      }
    });

    if (!proposals.proposals.nodes.length) {
      return {
        votes: {
          nodes: [],
          pageInfo: {
            firstCursor: '',
            lastCursor: '',
            count: 0
          }
        }
      };
    }

    // Step 3: Get votes for these proposals
    await globalRateLimiter.waitForRateLimit();
    const response = await client.request(GET_ADDRESS_VOTES_QUERY, {
      input: {
        filters: {
          proposalIds: [proposals.proposals.nodes[0].id],
          voter: input.address
        },
        page: {
          limit: input.limit || 20,
          afterCursor: input.afterCursor
        }
      }
    });

    // Return raw response
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new TallyAPIError(`Failed to fetch address votes: ${error.message}`);
    }
    throw new TallyAPIError('Failed to fetch address votes: Unknown error');
  }
} 