import { GraphQLClient } from 'graphql-request';
import { DelegateStatement } from '../../types.js';
import { GraphQLError } from 'graphql';
import { getDAO } from '../organizations/getDAO.js';
import { gql } from 'graphql-request';

const MAX_RETRIES = 5;
const BASE_DELAY = 2000; // 2 seconds
const MAX_DELAY = 10000; // 10 seconds

// Track last request time
let lastRequestTime = 0;

const GET_DELEGATE_STATEMENT_QUERY = gql`
  query GetDelegateStatement($address: AccountID!, $governorId: ID!) {
    account(id: $address) {
      delegateStatement(governorId: $governorId) {
        id
        address
        statement
        statementSummary
        isSeekingDelegation
        issues {
          id
          name
        }
        governor {
          id
          name
          type
        }
      }
    }
  }
`;

interface GetDelegateStatementInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (process.env.NODE_ENV === 'test') {
    console.log('Rate limit check:', {
      now,
      lastRequestTime,
      timeSinceLastRequest,
      needsDelay: timeSinceLastRequest < BASE_DELAY
    });
  }

  // Always wait at least BASE_DELAY between requests
  if (timeSinceLastRequest < BASE_DELAY) {
    const waitTime = BASE_DELAY - timeSinceLastRequest;
    if (process.env.NODE_ENV === 'test') {
      console.log(`Waiting ${waitTime}ms before next request`);
    }
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  if (process.env.NODE_ENV === 'test') {
    console.log('Updated lastRequestTime:', lastRequestTime);
  }
}

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  if (process.env.NODE_ENV === 'test') {
    console.log(`Exponential backoff: Waiting ${delay}ms on retry ${retryCount}`);
  }
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getDelegateStatement(
  client: GraphQLClient,
  input: GetDelegateStatementInput
): Promise<DelegateStatement | null> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      if (!input.address) {
        throw new Error('Address is required');
      }

      if (!input.governorId && !input.organizationSlug) {
        throw new Error('Either governorId or organizationSlug is required');
      }

      let governorId: string | undefined;

      if (input.governorId) {
        governorId = input.governorId;
      } else if (input.organizationSlug) {
        // Wait for rate limit before getDAO request
        await waitForRateLimit();
        const dao = await getDAO(client, input.organizationSlug);
        if (!dao.governorIds?.length) {
          throw new Error('Organization or governor not found');
        }
        governorId = dao.governorIds[0];
      }

      if (!governorId) {
        throw new Error('Failed to determine governorId');
      }

      // Wait for rate limit before delegate statement request
      await waitForRateLimit();

      const variables = {
        address: input.address,
        governorId
      };

      const response = await client.request<{
        account?: {
          delegateStatement: DelegateStatement | null;
        };
      }>(GET_DELEGATE_STATEMENT_QUERY, variables);

      if (!response.account?.delegateStatement) {
        return null;
      }

      return response.account.delegateStatement;
    } catch (error) {
      lastError = error;
      if (error instanceof GraphQLError) {
        const graphqlError = error as GraphQLError;
        
        // Handle rate limiting (429)
        if (graphqlError.response?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle other GraphQL errors
        if (graphqlError.response?.errors) {
          lastError = graphqlError.response.errors[0];
          if (lastError.message.includes('not found')) {
            return null;
          }
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch delegate statement: ${lastError?.message}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 