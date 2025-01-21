import { GraphQLClient } from 'graphql-request';
import { GetProposalVotesCastInput, ProposalVotesCastResponse } from './getProposalVotesCast.types.js';
import { TallyAPIError } from '../errors/apiErrors.js';

const GET_PROPOSAL_VOTES_CAST_QUERY = `
  query ProposalVotesCast($input: ProposalInput!) {
    proposal(input: $input) {
      onchainId
      status
      quorum
      voteStats {
        votesCount
        votersCount
        type
        percent
      }
      governor {
        quorum
        token {
          decimals
        }
        type
        id
      }
    }
  }
`;

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getProposalVotesCast(
  client: GraphQLClient,
  input: GetProposalVotesCastInput
): Promise<ProposalVotesCastResponse> {
  if (!input.id) {
    throw new TallyAPIError('proposalId is required');
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        input: {
          id: input.id
        }
      };

      const response = await client.request<ProposalVotesCastResponse>(
        GET_PROPOSAL_VOTES_CAST_QUERY,
        variables
      );

      // If we get a valid response with no proposal, return null
      if (!response?.proposal) {
        return { proposal: null };
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
          return { proposal: null };
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new TallyAPIError(`Failed to fetch proposal votes cast: ${lastError?.message || 'Unknown error'}`);
    }
  }

  throw new TallyAPIError('Maximum retries exceeded. Please try again later.');
} 