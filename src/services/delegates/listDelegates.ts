import { GraphQLClient } from 'graphql-request';
import { LIST_DELEGATES_QUERY } from './delegates.queries.js';
import { DelegatesResponse, Delegate } from './delegates.types.js';
import { PageInfo } from '../organizations/organizations.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import {
  TallyAPIError,
  RateLimitError,
  ValidationError,
  GraphQLRequestError
} from '../errors/apiErrors.js';
import { GraphQLError } from 'graphql';

const MAX_RETRIES = 5;

export async function listDelegates(
  client: GraphQLClient,
  input: {
    organizationId?: string;
    organizationSlug?: string;
    governorId?: string;
    limit?: number;
    afterCursor?: string;
    beforeCursor?: string;
    hasVotes?: boolean;
    hasDelegators?: boolean;
    isSeekingDelegation?: boolean;
  }
): Promise<{
  delegates: Delegate[];
  pageInfo: PageInfo;
}> {
  let retries = 0;
  let lastError: Error | null = null;
  let requestVariables: any;

  while (retries < MAX_RETRIES) {
    try {
      let organizationId = input.organizationId;

      // If we got a governor ID instead of organization ID, treat it as such
      if (organizationId?.startsWith('eip155:')) {
        if (!input.organizationSlug) {
          throw new ValidationError('Organization slug is required when using a governor ID as organization ID');
        }
        await globalRateLimiter.waitForRateLimit();
        const dao = await getDAO(client, input.organizationSlug);
        organizationId = dao.id;
      }

      // If organizationId is not provided but slug is, get the DAO first
      if (!organizationId && input.organizationSlug) {
        await globalRateLimiter.waitForRateLimit();
        const dao = await getDAO(client, input.organizationSlug);
        organizationId = dao.id;
      }

      // If we have a governorId but no organization info, get the DAO
      if (!organizationId && input.governorId) {
        throw new ValidationError('Using governorId without organizationSlug is not currently supported. Please provide organizationSlug.');
      }

      if (!organizationId) {
        throw new ValidationError('Either organizationId, organizationSlug, or governorId with organizationSlug must be provided');
      }

      // Wait for rate limit before making the request
      await globalRateLimiter.waitForRateLimit();

      requestVariables = {
        input: {
          filters: {
            organizationId,
            hasVotes: input.hasVotes,
            hasDelegators: input.hasDelegators,
            isSeekingDelegation: input.isSeekingDelegation,
          },
          sort: {
            isDescending: true,
            sortBy: 'votes',
          },
          page: {
            limit: Math.min(input.limit || 20, 50),
            afterCursor: input.afterCursor,
            beforeCursor: input.beforeCursor,
          },
        },
      };

      const response = await client.request<DelegatesResponse>(LIST_DELEGATES_QUERY, requestVariables);

      // Update rate limiter with response headers if available
      if ('headers' in response) {
        globalRateLimiter.updateFromHeaders(response.headers as Record<string, string>);
      }

      // Check if we got any delegates
      if (!response.delegates?.nodes?.length) {
        throw new ValidationError('No delegates found for the given organization');
      }

      return {
        delegates: response.delegates.nodes,
        pageInfo: response.delegates.pageInfo,
      };
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(String(error));
      }

      if (error instanceof GraphQLError) {
        // Handle rate limiting (429)
        const errorResponse = (error as any).response;
        if (errorResponse?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await globalRateLimiter.exponentialBackoff(retries);
            continue;
          }
          throw new RateLimitError('Rate limit exceeded after retries', {
            retries,
            status: errorResponse.status
          });
        }

        throw new GraphQLRequestError(
          `GraphQL error: ${lastError.message}`,
          'ListDelegates',
          requestVariables
        );
      }
      
      // If we've reached here, it's an unexpected error
      throw new TallyAPIError(`Failed to fetch delegates: ${lastError.message}`);
    }
  }

  throw new RateLimitError('Maximum retries exceeded');
} 