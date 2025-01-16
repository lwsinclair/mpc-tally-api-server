import { GraphQLClient } from 'graphql-request';
import { GetProposalVotersInput, ProposalVotersResponse } from './getProposalVoters.types.js';
import { GET_PROPOSAL_VOTERS_QUERY } from './proposals.queries.js';

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
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        input: {
          filters: {
            proposalId: input.proposalId
          },
          page: input.limit ? {
            limit: input.limit,
            afterCursor: input.afterCursor,
            beforeCursor: input.beforeCursor
          } : undefined,
          sort: input.sortBy ? {
            field: input.sortBy,
            isDescending: input.isDescending ?? false
          } : undefined
        }
      };

      const response = await client.request<ProposalVotersResponse>(
        GET_PROPOSAL_VOTERS_QUERY,
        variables
      );

      // If we get a valid response with no voters, return empty array
      if (!response.proposalVoters?.nodes) {
        return {
          proposalVoters: {
            nodes: [],
            pageInfo: {
              firstCursor: '',
              lastCursor: ''
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
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle invalid input (422) or other GraphQL errors
        if (graphqlError.response?.status === 422 || graphqlError.response?.errors) {
          return {
            proposalVoters: {
              nodes: [],
              pageInfo: {
                firstCursor: '',
                lastCursor: ''
              }
            }
          };
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch proposal voters: ${lastError?.message || 'Unknown error'}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 