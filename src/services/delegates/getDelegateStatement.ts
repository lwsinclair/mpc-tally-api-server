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

// Use discriminated union for input type
type GetDelegateStatementInput = {
  address: string;
} & (
  | { governorId: string; organizationSlug?: never }
  | { organizationSlug: string; governorId?: never }
);

export async function getDelegateStatement(
  client: GraphQLClient,
  input: GetDelegateStatementInput
): Promise<DelegateStatement | null> {
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

      // Wait for rate limit before delegate statement request
      await globalRateLimiter.waitForRateLimit();

      const variables = {
        input: {
          address: input.address,
          governorId,
          ...(organizationId && { organizationId })
        }
      };

      const response = await client.request<{
        delegate?: {
          statement: DelegateStatement | null;
        };
      }>(GET_DELEGATE_STATEMENT_QUERY, variables);

      // Update rate limiter with response headers if available
      if ('headers' in response) {
        globalRateLimiter.updateFromHeaders(response.headers as Record<string, string>);
      }

      if (!response.delegate?.statement) {
        return null;
      }

      // Return the statement without strict validation
      return response.delegate.statement;

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