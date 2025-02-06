import { GraphQLClient } from 'graphql-request';
import { GetProposalTimelineInput, ProposalTimelineResponse } from './getProposalTimeline.types.js';
import { GET_PROPOSAL_TIMELINE_QUERY } from './proposals.queries.js';
import { TallyAPIError } from '../errors/apiErrors.js';

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
  if (!input.proposalId) {
    throw new TallyAPIError('proposalId is required');
  }

  let retries = 0;
  let lastError: unknown = null;

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

      if (!response?.proposal) {
        throw new TallyAPIError('Proposal not found');
      }

      // Ensure events array exists
      if (!response.proposal.events) {
        response.proposal.events = [];
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
          throw new TallyAPIError(`Invalid input: ${error.message}`);
        }
      }
      
      throw new TallyAPIError(`Failed to fetch proposal timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new TallyAPIError(`Failed to fetch proposal timeline after ${MAX_RETRIES} retries`);
} 