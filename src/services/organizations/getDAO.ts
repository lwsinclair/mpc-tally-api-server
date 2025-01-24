import { GraphQLClient } from 'graphql-request';
import { GET_DAO_QUERY, GET_TOKEN_QUERY } from './organizations.queries.js';
import { Organization, Token, TokenWithSupply, OrganizationWithTokens } from './organizations.types.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { TallyAPIError, RateLimitError } from '../errors/apiErrors.js';
import { formatTokenAmount, FormattedTokenAmount } from '../../utils/formatTokenAmount.js';

export async function getDAO(
  client: GraphQLClient,
  slug: string
): Promise<{ organization: OrganizationWithTokens }> {
  let lastError: Error | null = null;
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 2000;

  while (retryCount < maxRetries) {
    try {
      await globalRateLimiter.waitForRateLimit();
      
      const input = { input: { slug } };
      const response = await client.request<{ organization: Organization }>(GET_DAO_QUERY, input);
      
      if (!response.organization) {
        throw new TallyAPIError(`DAO not found: ${slug}`);
      }

      // Fetch token information if tokenIds exist
      let tokens: TokenWithSupply[] | undefined;
      if (response.organization.tokenIds && response.organization.tokenIds.length > 0) {
        tokens = await getDAOTokens(client, response.organization.tokenIds);
      }
      
      return {
        ...response,
        organization: {
          ...response.organization,
          tokens
        }
      };
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
): Promise<TokenWithSupply[]> {
  if (!tokenIds || tokenIds.length === 0) {
    return [];
  }

  const tokens: TokenWithSupply[] = [];
  
  for (const tokenId of tokenIds) {
    try {
      await globalRateLimiter.waitForRateLimit();
      
      const input = { id: tokenId };
      const response = await client.request<{ token: Token }>(GET_TOKEN_QUERY, { input });
      
      if (response.token) {
        const token = response.token;
        const formattedSupply = formatTokenAmount(token.supply, token.decimals, token.symbol);
        tokens.push({
          ...token,
          formattedSupply,
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch token ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue with other tokens even if one fails
    }
  }
  
  return tokens;
} 