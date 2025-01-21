import { GraphQLClient } from 'graphql-request';
import { TallyAPIError } from '../errors/apiErrors.js';
import { formatTokenAmount } from '../../utils/formatTokenAmount.js';
import { GET_PROPOSAL_VOTES_CAST_LIST_QUERY, GET_PROPOSAL_VOTES_CAST_QUERY } from './proposals.queries.js';
import { GetProposalVotesCastListInput, ProposalVotesCastListResponse, VoteList } from './getProposalVotesCastList.types.js';

const MAX_RETRIES = 3;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
  await new Promise(resolve => setTimeout(resolve, delay));
}

function formatVoteList(voteList: VoteList, decimals: number, symbol: string): VoteList {
  return {
    ...voteList,
    nodes: voteList.nodes.map(vote => ({
      ...vote,
      formattedAmount: formatTokenAmount(vote.amount, decimals, symbol)
    }))
  };
}

export async function getProposalVotesCastList(
  client: GraphQLClient,
  input: GetProposalVotesCastListInput
): Promise<ProposalVotesCastListResponse> {
  if (!input.id) {
    throw new TallyAPIError('proposalId is required');
  }

  const baseInput = {
    filters: {
      proposalId: input.id
    },
    ...(input.page && {
      page: {
        cursor: input.page.cursor,
        limit: input.page.limit
      }
    })
  };

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      // First get the proposal to get token decimals and symbol
      const proposalResponse = await client.request(GET_PROPOSAL_VOTES_CAST_QUERY, { input: { id: input.id } });
      
      if (!proposalResponse.proposal) {
        throw new TallyAPIError('Proposal not found');
      }

      const { decimals, symbol } = proposalResponse.proposal.governor.token;

      // Then get the votes
      const response = await client.request<ProposalVotesCastListResponse>(
        GET_PROPOSAL_VOTES_CAST_LIST_QUERY,
        {
          forInput: { ...baseInput, filters: { ...baseInput.filters, type: 'for' } },
          againstInput: { ...baseInput, filters: { ...baseInput.filters, type: 'against' } },
          abstainInput: { ...baseInput, filters: { ...baseInput.filters, type: 'abstain' } }
        }
      );

      // Format amounts for each vote list
      return {
        forVotes: formatVoteList(response.forVotes, decimals, symbol),
        againstVotes: formatVoteList(response.againstVotes, decimals, symbol),
        abstainVotes: formatVoteList(response.abstainVotes, decimals, symbol)
      };
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
      
      // If we've reached here, it's an unexpected error
      throw new TallyAPIError(`Failed to fetch proposal votes cast list: ${lastError?.message || 'Unknown error'}`);
    }
  }

  throw new TallyAPIError(`Failed to fetch proposal votes cast list after ${MAX_RETRIES} retries`);
} 