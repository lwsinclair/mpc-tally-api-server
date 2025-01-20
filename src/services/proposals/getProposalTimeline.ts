import { GraphQLClient } from 'graphql-request';
import { GetProposalTimelineInput, ProposalTimelineResponse } from './getProposalTimeline.types.js';
import { GET_PROPOSAL_TIMELINE_QUERY } from './proposals.queries.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getProposalTimeline(
  client: GraphQLClient,
  input: GetProposalTimelineInput
): Promise<ProposalTimelineResponse> {
  let retries = 0;
  let lastError: unknown = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        input: {
          id: input.proposalId
        }
      };

      const response = await client.request<{ proposal: Record<string, any> }>(
        GET_PROPOSAL_TIMELINE_QUERY,
        variables
      );

      // If we get a valid response with no events, return empty array
      if (!response.proposal?.events) {
        return {
          proposal: {
            id: input.proposalId,
            onchainId: '',
            chainId: '',
            status: '',
            events: []
          }
        };
      }

      return response as ProposalTimelineResponse;
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
            proposal: {
              id: input.proposalId,
              onchainId: '',
              chainId: '',
              status: '',
              events: []
            }
          };
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch proposal timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 