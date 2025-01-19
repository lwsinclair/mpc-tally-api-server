import { GraphQLClient } from 'graphql-request';
import { DelegateStatement } from './delegates.types.js';
import { GraphQLError } from 'graphql';
import { getDAO } from '../organizations/getDAO.js';
import { gql } from 'graphql-request';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import {
  TallyAPIError,
  RateLimitError,
  ResourceNotFoundError,
  ValidationError,
  GraphQLRequestError
} from '../errors/apiErrors.js';

const MAX_RETRIES = 5;

const GET_DELEGATE_STATEMENT_QUERY = gql`
  query DelegateStatement($input: DelegateInput!) {
    delegate(input: $input) {
      statement {
        id
        address
        organizationID
        statement
        statementSummary
        isSeekingDelegation
        discourseUsername
        discourseProfileLink
        issues {
          id
          name
        }
      }
    }
  }
`;

const GET_ADDRESS_HEADER_QUERY = gql`
  query AddressHeader($accountId: AccountID!) {
    account(id: $accountId) {
      address
      bio
      name
      picture
      twitter
    }
  }
`;

// Use discriminated union for input type
type GetDelegateStatementInput = {
  address: string;
} & (
  | { governorId: string; organizationSlug?: never }
  | { organizationSlug: string; governorId?: never }
);

interface AccountHeader {
  address: string;
  bio?: string;
  name?: string;
  picture?: string;
  twitter?: string;
}

interface DelegateStatementResponse {
  statement: DelegateStatement | null;
  account: AccountHeader | null;
}

export async function getDelegateStatement(
  client: GraphQLClient,
  input: GetDelegateStatementInput
): Promise<DelegateStatementResponse | null> {
  // Input validation first
  if (!input.address) {
    throw new ValidationError('Address is required');
  }

  // Validate that only one of governorId or organizationSlug is provided
  if ('governorId' in input && 'organizationSlug' in input && input.governorId && input.organizationSlug) {
    throw new ValidationError('Cannot provide both governorId and organizationSlug');
  }

  if (!('governorId' in input) && !('organizationSlug' in input)) {
    throw new ValidationError('Either governorId or organizationSlug is required');
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.address)) {
    throw new ValidationError('Invalid address format');
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      let governorId: string;
      let organizationId: string;

      if ('governorId' in input && input.governorId) {
        // Validate governor ID format
        if (!/^eip155:\d+:0x[a-fA-F0-9]{40}$/.test(input.governorId)) {
          throw new ValidationError('Invalid governor ID format');
        }
        governorId = input.governorId;
      } else if ('organizationSlug' in input && input.organizationSlug) {
        // Wait for rate limit before getDAO request
        await globalRateLimiter.waitForRateLimit();
        try {
          const dao = await getDAO(client, input.organizationSlug);
          if (!dao.governorIds?.length) {
            return null;
          }
          governorId = dao.governorIds[0];
          organizationId = dao.id;
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return null;
          }
          throw error;
        }
      }

      // Format the account ID for the header query
      const accountId = `eip155:1:${input.address.toLowerCase()}`;

      // Make both requests in parallel
      const [statementResponse, accountResponse] = await Promise.all([
        // Get delegate statement
        (async () => {
          await globalRateLimiter.waitForRateLimit();
          const variables = {
            input: {
              address: input.address,
              governorId,
              ...(organizationId && { organizationId })
            }
          };
          return client.request<{
            delegate?: {
              statement: DelegateStatement | null;
            };
          }>(GET_DELEGATE_STATEMENT_QUERY, variables);
        })(),

        // Get account header
        (async () => {
          await globalRateLimiter.waitForRateLimit();
          return client.request<{
            account: AccountHeader | null;
          }>(GET_ADDRESS_HEADER_QUERY, { accountId });
        })()
      ]);

      // Update rate limiter with response headers if available
      if ('headers' in statementResponse) {
        globalRateLimiter.updateFromHeaders(statementResponse.headers as Record<string, string>);
      }
      if ('headers' in accountResponse) {
        globalRateLimiter.updateFromHeaders(accountResponse.headers as Record<string, string>);
      }

      // If we don't have a statement, return null
      if (!statementResponse.delegate?.statement) {
        return null;
      }

      // Return combined response
      return {
        statement: statementResponse.delegate.statement,
        account: accountResponse.account
      };

    } catch (error) {
      if (error instanceof GraphQLError) {
        const graphqlError = error as GraphQLError;
        
        // Handle rate limiting (429)
        if (graphqlError.response?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await globalRateLimiter.exponentialBackoff(retries);
            continue;
          }
          throw new RateLimitError('Rate limit exceeded after retries', {
            retries,
            status: graphqlError.response.status
          });
        }

        // Handle other GraphQL errors
        if (graphqlError.response?.errors) {
          const errorMessage = graphqlError.response.errors[0]?.message;
          if (errorMessage?.includes('not found')) {
            return null;
          }
          if (errorMessage?.includes('not valid')) {
            throw new ValidationError(errorMessage);
          }
        }
      }

      // If we've reached here and it's already a known error type, rethrow it
      if (error instanceof ValidationError || 
          error instanceof ResourceNotFoundError || 
          error instanceof RateLimitError ||
          error instanceof TallyAPIError) {
        throw error;
      }
      
      // Otherwise, wrap it in a ValidationError for invalid inputs
      if (error instanceof Error && 
          (error.message.includes('not valid') || 
           error.message.includes('invalid') || 
           error.message.includes('not found'))) {
        throw new ValidationError(error.message);
      }

      // For any other unexpected errors
      throw new TallyAPIError(`Failed to fetch delegate statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new RateLimitError('Maximum retries exceeded');
} 