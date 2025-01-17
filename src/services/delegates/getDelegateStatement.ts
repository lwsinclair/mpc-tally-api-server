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

const GET_DELEGATE_QUERY = gql`
  query GetDelegate($input: DelegateInput!) {
    delegate(input: $input) {
      id
      account {
        address
      }
      statement {
        statement
        statementSummary
        isSeekingDelegation
        issues {
          id
          name
        }
      }
      governor {
        id
        name
        type
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

// Validate Ethereum address format
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate governor ID format
const isValidGovernorId = (governorId: string): boolean => {
  return /^eip155:1:0x[a-fA-F0-9]{40}$/.test(governorId);
};

export async function getDelegateStatement(
  client: GraphQLClient,
  input: GetDelegateStatementInput
): Promise<DelegateStatement | null> {
  let retries = 0;
  let lastError: Error | null = null;

  // Input validation
  if (!input.address) {
    throw new ValidationError('Address is required');
  }

  if (!isValidEthereumAddress(input.address)) {
    throw new ValidationError('Invalid Ethereum address format');
  }

  if (!input.governorId && !input.organizationSlug) {
    throw new ValidationError('Either governorId or organizationSlug is required');
  }

  if (input.governorId && input.organizationSlug) {
    throw new ValidationError('Cannot provide both governorId and organizationSlug');
  }

  while (retries < MAX_RETRIES) {
    try {
      let governorId: string;

      if ('governorId' in input && input.governorId) {
        // Format the governor ID if needed
        governorId = input.governorId.startsWith('eip155:1:') ? input.governorId : `eip155:1:${input.governorId}`;
      } else if ('organizationSlug' in input && input.organizationSlug) {
        // Wait for rate limit before getDAO request
        await globalRateLimiter.waitForRateLimit();
        try {
          const dao = await getDAO(client, input.organizationSlug);
          if (!dao.governorIds?.length) {
            return null;
          }
          governorId = dao.governorIds[0];
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return null;
          }
          if (error instanceof TallyAPIError && error.message.includes('Organization not found')) {
            return null;
          }
          throw new TallyAPIError(`Failed to fetch DAO: ${error.message}`);
        }
      } else {
        throw new ValidationError('Either governorId or organizationSlug is required');
      }

      // Wait for rate limit before delegate request
      await globalRateLimiter.waitForRateLimit();

      const variables = {
        input: {
          address: input.address,
          governorId
        }
      };

      const response = await client.request<{
        delegate: {
          id: string;
          account: {
            address: string;
          };
          statement: {
            statement: string;
            statementSummary: string;
            isSeekingDelegation: boolean;
            issues: Array<{
              id: string;
              name: string;
            }> | null;
          } | null;
          governor: {
            id: string;
            name: string;
            type: string;
          } | null;
        } | null;
      }>(GET_DELEGATE_QUERY, variables);

      // Update rate limiter with response headers if available
      if ('headers' in response) {
        globalRateLimiter.updateFromHeaders(response.headers as Record<string, string>);
      }

      if (!response.delegate?.statement) {
        return null;
      }

      // Transform the response to match our DelegateStatement type
      return {
        id: response.delegate.id,
        address: response.delegate.account.address,
        statement: response.delegate.statement.statement,
        statementSummary: response.delegate.statement.statementSummary,
        isSeekingDelegation: response.delegate.statement.isSeekingDelegation,
        issues: response.delegate.statement.issues || [],
        governor: response.delegate.governor || undefined
      };
    } catch (error) {
      lastError = error;
      if (error instanceof GraphQLError) {
        // Check if we have a response with data
        if (error.response?.data?.delegate === null) {
          return null;
        }

        // Check for errors in the response
        if (error.response?.errors?.length > 0) {
          const firstError = error.response.errors[0];
          const errorMessage = firstError.message.toLowerCase();
          const errorPath = firstError.path?.join('.');
          
          // Return null for specific error cases
          if (
            errorMessage.includes('not found') ||
            errorMessage.includes('not valid') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('account id is not valid') ||
            errorMessage.includes('internal system error')
          ) {
            return null;
          }
        }

        // Check if it's a GraphQL response error with null data
        if (error.response?.data?.delegate === null) {
          return null;
        }

        throw new TallyAPIError(`Failed to fetch delegate: ${error.message}`, {
          response: error.response,
          request: error.request,
        });
      }
      
      // If we've reached here, it's an unexpected error
      if (lastError?.message?.toLowerCase().includes('internal system error')) {
        return null;
      }
      throw new TallyAPIError(`Failed to fetch delegate: ${lastError?.message}`);
    }
  }

  throw new RateLimitError('Maximum retries exceeded');
} 