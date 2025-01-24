import { GraphQLClient } from 'graphql-request';
import { getDAO } from '../organizations/getDAO.js';

export interface GetAddressVotesResponse {
  votes: {
    nodes: Array<{
      id: string;
      type: string;
      amount: string;
      voter: {
        address: string;
      };
      proposal: {
        id: string;
      };
      block: {
        timestamp: string;
        number: number;
      };
      chainId: string;
      txHash: string;
    }>;
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
      count: number;
    };
  };
}

const GET_ADDRESS_VOTES_QUERY = `
  query GetAddressVotes($input: VotesInput!) {
    votes(input: $input) {
      nodes {
        ... on Vote {
          id
          type
          amount
          voter {
            address
          }
          proposal {
            id
          }
          block {
            timestamp
            number
          }
          chainId
          txHash
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }
  }
`;

export async function getAddressVotes(
  client: GraphQLClient,
  input: {
    address: string;
    organizationSlug: string;
    limit?: number;
    afterCursor?: string;
  }
): Promise<GetAddressVotesResponse> {
  // First get the DAO to get the governor IDs
  const { organization: dao } = await getDAO(client, input.organizationSlug);

  // Get proposals for this DAO to get their IDs
  const proposalsResponse = await client.request<{
    proposals: {
      nodes: Array<{ id: string }>;
    };
  }>(
    `query GetProposals($input: ProposalsInput!) {
      proposals(input: $input) {
        nodes {
          ... on Proposal {
            id
          }
        }
      }
    }`,
    {
      input: {
        filters: {
          organizationId: dao.id,
        },
        page: {
          limit: 100, // Get a reasonable number of proposals
        },
      },
    }
  );

  const proposalIds = proposalsResponse.proposals.nodes.map((node) => node.id);

  // Now get the votes for these proposals from this voter
  return client.request<GetAddressVotesResponse>(GET_ADDRESS_VOTES_QUERY, {
    input: {
      filters: {
        proposalIds,
        voter: input.address,
      },
      page: {
        limit: input.limit || 20,
        afterCursor: input.afterCursor,
      },
    },
  });
}