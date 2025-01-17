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
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      if (!input.address) {
        throw new ValidationError('Address is required');
      }

      let governorId: string;
      let organizationId: string;

      if ('governorId' in input && input.governorId) {
        governorId = input.governorId;
      } else if ('organizationSlug' in input && input.organizationSlug) {
        // Wait for rate limit before getDAO request
        await globalRateLimiter.waitForRateLimit();
        const dao = await getDAO(client, input.organizationSlug);
        if (!dao.governorIds?.length) {
          throw new ResourceNotFoundError('Organization or governor', input.organizationSlug);
        }
        governorId = dao.governorIds[0];
        organizationId = dao.id;
      } else {
        throw new ValidationError('Either governorId or organizationSlug is required');
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

      return response.delegate.statement;
    } catch (error) {
      lastError = error;
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
          lastError = graphqlError.response.errors[0];
          if (lastError.message.includes('not found')) {
            return null;
          }
        }

        throw new GraphQLRequestError(
          `GraphQL error: ${lastError?.message}`,
          'GetDelegateStatement',
          variables
        );
      }
      
      // If we've reached here, it's an unexpected error
      throw new TallyAPIError(`Failed to fetch delegate statement: ${lastError?.message}`);
    }
  }

  throw new RateLimitError('Maximum retries exceeded');
} 