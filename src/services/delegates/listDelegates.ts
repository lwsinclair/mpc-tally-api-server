import { GraphQLClient } from 'graphql-request';
import { LIST_DELEGATES_QUERY } from './delegates.queries.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { getDAO } from '../organizations/getDAO.js';
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
    organizationSlug: string;
    limit?: number;
    afterCursor?: string;
    beforeCursor?: string;
    hasVotes?: boolean;
    hasDelegators?: boolean;
    isSeekingDelegation?: boolean;
  }
): Promise<any> {
  let retries = 0;
  let lastError: Error | null = null;
  let requestVariables: any;

  while (retries < MAX_RETRIES) {
    try {
      if (!input.organizationSlug) {
        throw new ValidationError('organizationSlug is required');
      }

      // Get the DAO to get its ID
      await globalRateLimiter.waitForRateLimit();
      const { organization: dao } = await getDAO(client, input.organizationSlug);
      const organizationId = dao.id;

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

      const response = await client.request<Record<string, any>>(LIST_DELEGATES_QUERY, requestVariables);

      // Update rate limiter with response headers if available
      if ('headers' in response) {
        globalRateLimiter.updateFromHeaders(response.headers as Record<string, string>);
      }

      // Return the raw response
      return response;

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