import { GraphQLClient } from 'graphql-request';
import { GetAddressReceivedDelegationsInput } from './addresses.types.js';
import { GraphQLError } from 'graphql';
import { getDAO } from '../organizations/getDAO.js';
import { gql } from 'graphql-request';

// Rate limit: 1 request per second, but be more conservative
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY = 2000; // 2 seconds to be safe
const DEFAULT_MAX_DELAY = 10000; // 10 seconds

// Test environment settings
const TEST_MAX_RETRIES = 10;
const TEST_BASE_DELAY = 2000; // 2 seconds
const TEST_MAX_DELAY = 10000; // 10 seconds

// Use test settings if NODE_ENV is 'test'
const IS_TEST = process.env.NODE_ENV === 'test';
const MAX_RETRIES = IS_TEST ? TEST_MAX_RETRIES : DEFAULT_MAX_RETRIES;
const BASE_DELAY = IS_TEST ? TEST_BASE_DELAY : DEFAULT_BASE_DELAY;
const MAX_DELAY = IS_TEST ? TEST_MAX_DELAY : DEFAULT_MAX_DELAY;

// Track last request time and remaining rate limit
let lastRequestTime = 0;
let remainingRequests: number | null = null;
let rateLimitResetTime: number | null = null;

const GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY = gql`
  query ReceivedDelegationsGovernance($input: DelegationsInput!) {
    delegators(input: $input) {
      nodes {
        ... on Delegation {
          id
          chainId
          blockNumber
          blockTimestamp
          votes
          delegator {
            address
            name
            picture
            twitter
            ens
          }
          token {
            id
            type
            name
            symbol
            decimals
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

function parseRateLimitHeaders(headers: Record<string, string>) {
  // Parse rate limit headers if they exist
  if (headers['x-ratelimit-remaining']) {
    remainingRequests = parseInt(headers['x-ratelimit-remaining'], 10);
  }
  if (headers['x-ratelimit-reset']) {
    rateLimitResetTime = parseInt(headers['x-ratelimit-reset'], 10) * 1000; // Convert to milliseconds
  }
  
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  
  // If we have rate limit info and no remaining requests, wait until reset
  if (remainingRequests === 0 && rateLimitResetTime) {
    const waitTime = Math.max(0, rateLimitResetTime - now);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      remainingRequests = null;
      rateLimitResetTime = null;
      return;
    }
  }
  
  // Always wait at least BASE_DELAY between requests
  if (timeSinceLastRequest < BASE_DELAY) {
    const waitTime = BASE_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getAddressReceivedDelegations(
  client: GraphQLClient,
  input: GetAddressReceivedDelegationsInput
): Promise<any> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      if (!input.organizationSlug) {
        throw new Error('organizationSlug is required');
      }

      // Wait for rate limit before getDAO request
      await waitForRateLimit();
      const { organization: dao } = await getDAO(client, input.organizationSlug);
      if (!dao.id) {
        throw new Error('Organization not found');
      }

      // Wait for rate limit before delegations request
      await waitForRateLimit();

      const variables = {
        input: {
          filters: {
            address: input.address,
            organizationId: dao.id
          },
          page: input.limit ? { limit: input.limit } : undefined,
          sort: input.sortBy ? {
            sortBy: input.sortBy,
            isDescending: input.isDescending ?? true
          } : undefined
        }
      };

      const response = await client.request<Record<string, any>>(GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY, variables);

      // Parse rate limit headers from successful response
      if ('headers' in response) {
        parseRateLimitHeaders(response.headers as Record<string, string>);
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
        const errorResponse = (error as any).response;
        
        // Parse rate limit headers from error response
        if (errorResponse?.headers) {
          parseRateLimitHeaders(errorResponse.headers);
        }
        
        // Handle rate limiting (429)
        if (errorResponse?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle other GraphQL errors
        if (errorResponse?.errors) {
          const graphqlError = errorResponse.errors[0];
          if (graphqlError?.message?.includes('not found')) {
            return { delegators: { nodes: [], pageInfo: {} } };
          }
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch received delegations: ${lastError.message}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 