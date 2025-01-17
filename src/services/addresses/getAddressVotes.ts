import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput, VotesResponse, Vote } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { listProposals } from '../proposals/listProposals.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { TallyAPIError, ValidationError } from '../errors/apiErrors.js';

async function getProposalIds(client: GraphQLClient, organizationId: string): Promise<string[]> {
  try {
    console.log('Fetching proposals for organization:', organizationId);
    console.log('Using client with headers:', client.requestConfig.headers);
    
    const response = await listProposals(client, {
      filters: {
        organizationId,
      },
    });

    console.log('Raw proposals response:', JSON.stringify(response, null, 2));

    // Check if response has the expected structure
    if (!response?.proposals?.nodes) {
      console.error('Invalid proposals response structure:', response);
      throw new Error('Invalid proposals response structure');
    }

    const proposalIds = response.proposals.nodes.map((proposal) => proposal.id);
    console.log('Found proposal IDs:', proposalIds);
    return proposalIds;
  } catch (error) {
    console.error('Error in getProposalIds:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

async function getVotesPage(
  client: GraphQLClient,
  address: string,
  proposalIds: string[],
  limit?: number,
  afterCursor?: string,
): Promise<VotesResponse> {
  const variables = {
    input: {
      proposalIds,
      voter: address,
      limit,
      afterCursor,
    },
  };

  try {
    console.log('Fetching votes with variables:', JSON.stringify(variables, null, 2));
    const response = await client.request<{ votes: { nodes: Vote[]; pageInfo: VotesResponse['pageInfo'] } }>(
      GET_ADDRESS_VOTES_QUERY,
      variables
    );
    console.log('Raw votes response:', JSON.stringify(response, null, 2));

    // Handle empty response
    if (!response?.votes?.nodes) {
      console.log('No votes found, returning empty response');
      return {
        nodes: [],
        pageInfo: {
          firstCursor: '',
          lastCursor: '',
          count: 0
        }
      };
    }

    // Map the response to our expected format
    const nodes = response.votes.nodes.map(vote => ({
      id: vote.id,
      type: vote.type,
      amount: vote.amount,
      voter: { address: vote.voter.address },
      proposal: { id: vote.proposal.id },
      block: vote.block, // Add this
      chainId: vote.chainId, // Add this
      txHash: vote.txHash // Add this
    }));

    return {
      nodes,
      pageInfo: {
        firstCursor: response.votes.pageInfo.firstCursor || '',
        lastCursor: response.votes.pageInfo.lastCursor || '',
        count: response.votes.pageInfo.count || 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching votes:', error);
    throw new TallyAPIError('Error fetching votes: ' + error.message);
  }
}

export async function getAddressVotes(
  client: GraphQLClient,
  input: AddressVotesInput
): Promise<{ votes: VotesResponse }> {
  try {
    console.log('getAddressVotes called with input:', input);

    // Get the DAO first to get the organization ID
    const dao = await getDAO(client, input.organizationSlug);
    console.log('Got DAO:', JSON.stringify(dao, null, 2));

    if (!dao || !dao.id) {
      console.error('Invalid DAO response:', dao);
      throw new Error('Organization not found');
    }

    // Get proposal IDs for the organization
    console.log('Getting proposal IDs for organization:', dao.id);
    const proposalIds = await getProposalIds(client, dao.id);
    console.log('Got proposal IDs:', proposalIds);

    if (!proposalIds || proposalIds.length === 0) {
      console.log('No proposals found for organization');
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

    // Get votes for the address and proposals
    console.log('Getting votes for address and proposals:', {
      address: input.address,
      proposalIds,
      afterCursor: input.afterCursor,
      limit: input.limit
    });

    const votesResponse = await getVotesPage(
      client,
      input.address,
      proposalIds,
      input.limit || 20,
      input.afterCursor
    );

    console.log('Got votes response:', JSON.stringify(votesResponse, null, 2));
    return { votes: votesResponse };
  } catch (error) {
    console.error('Error in getAddressVotes:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
} 