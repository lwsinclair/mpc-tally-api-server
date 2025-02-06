import { GraphQLClient } from 'graphql-request';
import { GetProposalVotersInput, ProposalVotersResponse } from './getProposalVoters.types.js';
import { GET_PROPOSAL_VOTERS_QUERY } from './proposals.queries.js';
import { TallyAPIError } from '../errors/apiErrors.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getProposalVoters(
  client: GraphQLClient,
  input: GetProposalVotersInput
): Promise<ProposalVotersResponse> {
  if (!input.proposalId) {
    throw new TallyAPIError('proposalId is required');
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        input: {
          filters: {
            proposalId: input.proposalId
          },
          page: {
            limit: input.limit || 20,
            afterCursor: input.afterCursor,
            beforeCursor: input.beforeCursor
          },
          sort: input.sortBy ? {
            field: input.sortBy,
            isDescending: input.isDescending ?? true
          } : undefined
        }
      };

      const response = await client.request<ProposalVotersResponse>(
        GET_PROPOSAL_VOTERS_QUERY,
        variables
      );

      if (!response?.votes?.nodes) {
        return {
          votes: {
            nodes: [],
            pageInfo: {
              firstCursor: '',
              lastCursor: '',
              count: 0
            }
          }
        };
      }

      return response;
    } catch (error) {
      lastError = error;
      if (error instanceof Error) {
        const graphqlError = error as any;
        
        // Handle rate limiting (429)
        if (graphqlError.response?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
          throw new TallyAPIError('Rate limit exceeded. Please try again later.');
        }

        // Handle invalid input (422) or other GraphQL errors
        if (graphqlError.response?.status === 422 || graphqlError.response?.errors) {
          throw new TallyAPIError(`Invalid input: ${lastError?.message || 'Unknown error'}`);
        }
      }
      
      throw new TallyAPIError(`Failed to fetch proposal voters: ${lastError?.message || 'Unknown error'}`);
    }
  }

  throw new TallyAPIError(`Failed to fetch proposal voters after ${MAX_RETRIES} retries`);
} 