import { GraphQLClient } from 'graphql-request';
import { GET_DAO_QUERY, GET_TOKEN_QUERY } from './organizations.queries.js';
import { Organization, Token } from './organizations.types.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { TallyAPIError, RateLimitError } from '../errors/apiErrors.js';

export async function getDAO(
  client: GraphQLClient,
  slug: string
): Promise<Organization> {
  let lastError: Error | null = null;
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 2000;

  while (retryCount < maxRetries) {
    try {
      await globalRateLimiter.waitForRateLimit();
      
      const input = { slug };
      const response = await client.request<{ organization: Organization }>(GET_DAO_QUERY, { input });
      
      if (!response.organization) {
        throw new TallyAPIError(`DAO not found: ${slug}`);
      }
      
      return response.organization;
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        if (retryCount < maxRetries - 1) {
          retryCount++;
          // Use exponential backoff
          const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new RateLimitError('Rate limit exceeded when fetching DAO', {
          slug,
          retryCount,
          lastError: error.message
        });
      }
      
      // For other errors, throw immediately
      throw new TallyAPIError(`Failed to fetch DAO: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        slug,
        retryCount,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // This should never happen due to the while loop condition
  throw new TallyAPIError('Failed to fetch DAO: Max retries exceeded', {
    slug,
    retryCount,
    lastError: lastError?.message
  });
}

export async function getDAOTokens(
  client: GraphQLClient,
  tokenIds: string[]
): Promise<Token[]> {
  if (!tokenIds || tokenIds.length === 0) {
    return [];
  }

  const tokens: Token[] = [];
  
  for (const tokenId of tokenIds) {
    try {
      await globalRateLimiter.waitForRateLimit();
      
      const input = { id: tokenId };
      const response = await client.request<{ token: Token }>(GET_TOKEN_QUERY, { input });
      
      if (response.token) {
        tokens.push(response.token);
      }
    } catch (error) {
      console.warn(`Failed to fetch token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue with other tokens even if one fails
    }
  }
  
  return tokens;
} 