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
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        input: {
          id: input.proposalId
        }
      };

      const response = await client.request<ProposalTimelineResponse>(
        GET_PROPOSAL_TIMELINE_QUERY,
        variables
      );

      // If we get a valid response with no events, return empty array
      if (!response.proposal?.events) {
        return {
          proposal: {
            events: []
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

        // Handle other GraphQL errors
        if (graphqlError.response?.errors) {
          const gqlError = graphqlError.response.errors[0];
          // If the proposal doesn't exist, return empty result
          if (gqlError.message.includes('not found') || gqlError.message.includes('invalid input')) {
            return {
              proposal: {
                events: []
              }
            };
          }
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch proposal timeline: ${lastError?.message || 'Unknown error'}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 