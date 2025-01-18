import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput, VotesResponse, Vote } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { listProposals } from '../proposals/listProposals.js';
import { TallyAPIError } from '../errors/apiErrors.js';

async function getVotesForAddress(
  client: GraphQLClient,
  address: string,
  proposalIds: string[],
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
    const response = await client.request<{ votes: { nodes: Vote[]; pageInfo: VotesResponse['pageInfo'] } }>(
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
        id: vote.id,
        type: vote.type,
        amount: vote.amount,
        voter: { id: vote.voter.id, address: vote.voter.address },
        proposal: { id: vote.proposal.id },
        block: vote.block,
        chainId: vote.chainId,
        txHash: vote.txHash
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
    // Get the DAO first to get the organization ID
    const dao = await getDAO(client, input.organizationSlug);
    
    if (!dao?.id) {
      throw new TallyAPIError('Organization not found');
    }

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

    // Get votes for these proposals
    const votesResponse = await getVotesForAddress(
      client,
      input.address,
      proposalIds,
      input.limit,
      input.afterCursor
    );

    return { votes: votesResponse };
  } catch (error: any) {
    throw new TallyAPIError(`Error fetching address votes: ${error.message}`);
  }
}