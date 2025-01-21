import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput, VotesResponse, Vote, FormattedTokenAmount } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { listProposals } from '../proposals/listProposals.js';
import { TallyAPIError } from '../errors/apiErrors.js';
import { formatUnits } from 'ethers';

type RawVote = Omit<Vote, 'amount'> & { amount: string };

async function getVotesForAddress(
  client: GraphQLClient,
  address: string,
  proposalIds: string[],
  token: { decimals: number; symbol?: string } | undefined,
  limit?: number,
  afterCursor?: string,
): Promise<VotesResponse> {
  const variables = {
    input: {
      filters: {
        voter: address,
        proposalIds
      },
      page: {
        limit: limit || 20,
        afterCursor
      }
    },
  };

  try {
    const response = await client.request<{ votes: { nodes: RawVote[]; pageInfo: VotesResponse['pageInfo'] } }>(
      GET_ADDRESS_VOTES_QUERY,
      variables
    );

    if (!response?.votes?.nodes) {
      return {
        nodes: [],
        pageInfo: {
          firstCursor: '',
          lastCursor: '',
          count: 0
        }
      };
    }

    return {
      nodes: response.votes.nodes.map(vote => ({
        ...vote,
        amount: token ? {
          raw: vote.amount,
          formatted: formatUnits(vote.amount, token.decimals),
          readable: `${formatUnits(vote.amount, token.decimals)}${token.symbol ? ` ${token.symbol}` : ''}`
        } : {
          raw: vote.amount,
          formatted: vote.amount,
          readable: vote.amount
        }
      })),
      pageInfo: {
        firstCursor: response.votes.pageInfo.firstCursor || '',
        lastCursor: response.votes.pageInfo.lastCursor || '',
        count: response.votes.pageInfo.count || 0
      }
    };
  } catch (error: any) {
    throw new TallyAPIError(`Failed to fetch votes: ${error.message}`);
  }
}

export async function getAddressVotes(
  client: GraphQLClient,
  input: AddressVotesInput
): Promise<{ votes: VotesResponse }> {
  try {
    // Get the DAO first to get the organization ID and token info
    const { organization: dao } = await getDAO(client, input.organizationSlug);
    
    if (!dao?.id) {
      throw new TallyAPIError('Organization not found');
    }

    // Get token info from the DAO
    const token = dao.tokens?.[0] ? {
      decimals: dao.tokens[0].decimals,
      symbol: dao.tokens[0].symbol
    } : undefined;

    // Get all proposals for the organization
    const proposalsResponse = await listProposals(client, {
      filters: {
        organizationId: dao.id
      },
      page: {
        limit: 50 // Get a reasonable number of proposals
      }
    });

    if (!proposalsResponse?.proposals?.nodes?.length) {
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

    // Extract proposal IDs
    const proposalIds = proposalsResponse.proposals.nodes.map(proposal => proposal.id);

    // Get votes for these proposals with token formatting
    const votesResponse = await getVotesForAddress(
      client,
      input.address,
      proposalIds,
      token,
      input.limit,
      input.afterCursor
    );

    return { votes: votesResponse };
  } catch (error: any) {
    throw new TallyAPIError(`Error fetching address votes: ${error.message}`);
  }
}