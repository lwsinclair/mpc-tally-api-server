import { GraphQLClient } from 'graphql-request';
import { DelegationNode, GetAddressReceivedDelegationsInput, GetAddressReceivedDelegationsOutput, PageInfo } from '../../types.js';
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
  query GetDelegations($input: DelegationsInput!) {
    delegatees(input: $input) {
      nodes {
        ... on Delegation {
          id
          votes
          delegator {
            id
            address
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
  if (IS_TEST) {
    console.log('Response headers:', headers);
  }
  
  // Parse rate limit headers if they exist
  if (headers['x-ratelimit-remaining']) {
    remainingRequests = parseInt(headers['x-ratelimit-remaining'], 10);
  }
  if (headers['x-ratelimit-reset']) {
    rateLimitResetTime = parseInt(headers['x-ratelimit-reset'], 10) * 1000; // Convert to milliseconds
  }
  
  if (IS_TEST && (remainingRequests !== null || rateLimitResetTime !== null)) {
    console.log('Rate limit info:', { remainingRequests, rateLimitResetTime });
  }
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (IS_TEST) {
    console.log('Rate limit check:', {
      now,
      lastRequestTime,
      timeSinceLastRequest,
      remainingRequests,
      rateLimitResetTime,
      needsDelay: timeSinceLastRequest < BASE_DELAY
    });
  }
  
  // If we have rate limit info and no remaining requests, wait until reset
  if (remainingRequests === 0 && rateLimitResetTime) {
    const waitTime = Math.max(0, rateLimitResetTime - now);
    if (waitTime > 0) {
      if (IS_TEST) {
        console.log(`Rate limit exceeded, waiting ${waitTime}ms for reset`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
      remainingRequests = null;
      rateLimitResetTime = null;
      return;
    }
  }
  
  // Always wait at least BASE_DELAY between requests
  if (timeSinceLastRequest < BASE_DELAY) {
    const waitTime = BASE_DELAY - timeSinceLastRequest;
    if (IS_TEST) {
      console.log(`Waiting ${waitTime}ms before next request`);
    }
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  if (IS_TEST) {
    console.log('Updated lastRequestTime:', lastRequestTime);
  }
}

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  if (IS_TEST) {
    console.log(`Exponential backoff: Waiting ${delay}ms on retry ${retryCount}`);
  }
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getAddressReceivedDelegations(
  client: GraphQLClient,
  input: GetAddressReceivedDelegationsInput
): Promise<GetAddressReceivedDelegationsOutput> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      let governorId: string | undefined;

      if (input.governorId) {
        governorId = input.governorId;
      } else if (input.organizationSlug) {
        if (IS_TEST) {
          console.log('Making getDAO request...');
        }
        // Wait for rate limit before getDAO request
        await waitForRateLimit();
        const dao = await getDAO(client, input.organizationSlug);
        if (!dao.governorIds?.length) {
          throw new Error('Organization or governor not found');
        }
        governorId = dao.governorIds[0];
      } else {
        throw new Error('Either governorId or organizationSlug is required');
      }

      if (IS_TEST) {
        console.log('Making delegations request...');
      }
      // Wait for rate limit before delegations request
      await waitForRateLimit();

      const variables = {
        input: {
          filters: {
            address: input.address,
            governorId
          },
          page: input.limit ? { limit: input.limit } : undefined,
          sort: input.sortBy ? {
            field: input.sortBy,
            direction: input.isDescending ? 'DESC' : 'ASC'
          } : undefined
        }
      };

      const response = await client.request<{
        delegatees: {
          nodes: Array<{
            id: string;
            votes: string;
            delegator: {
              id: string;
              address: string;
            };
          }>;
          pageInfo: {
            firstCursor: string;
            lastCursor: string;
          };
        };
      }>(GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY, variables);

      // Parse rate limit headers from successful response
      if (response.headers) {
        parseRateLimitHeaders(response.headers);
      }

      if (!response.delegatees) {
        return {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }

      return {
        nodes: response.delegatees.nodes.map(node => ({
          id: node.id,
          votes: node.votes,
          delegator: {
            id: node.delegator.id,
            address: node.delegator.address,
          },
        })),
        pageInfo: {
          hasNextPage: !!response.delegatees.pageInfo.lastCursor,
          hasPreviousPage: !!response.delegatees.pageInfo.firstCursor,
          startCursor: response.delegatees.pageInfo.firstCursor || null,
          endCursor: response.delegatees.pageInfo.lastCursor || null,
        },
        totalCount: response.delegatees.nodes.length,
      };
    } catch (error) {
      lastError = error;
      if (error instanceof GraphQLError) {
        const graphqlError = error as GraphQLError;
        
        // Parse rate limit headers from error response
        if (graphqlError.response?.headers) {
          parseRateLimitHeaders(graphqlError.response.headers);
        }
        
        // Handle rate limiting (429)
        if (graphqlError.response.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            if (IS_TEST) {
              console.log(`Rate limited (429), attempt ${retries}/${MAX_RETRIES}`);
            }
            await exponentialBackoff(retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle other GraphQL errors
        if (graphqlError.response.errors) {
          lastError = graphqlError.response.errors[0];
          if (lastError.message.includes('not found')) {
            return {
              nodes: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              totalCount: 0,
            };
          }
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch received delegations: ${lastError?.message}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 