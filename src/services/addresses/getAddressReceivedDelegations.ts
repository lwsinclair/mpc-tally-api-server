import { GraphQLClient } from 'graphql-request';
import { DelegationNode, GetAddressReceivedDelegationsInput, GetAddressReceivedDelegationsOutput, PageInfo } from '../../types.js';
import { GraphQLError } from 'graphql';
import { getDAO } from '../organizations/getDAO.js';
import { gql } from 'graphql-request';

const MAX_RETRIES = 5;
const BASE_DELAY = 2000;
const MAX_DELAY = 30000;

const GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY = gql`
  query GetDelegations($input: DelegationsInput!) {
    delegatees(input: $input) {
      nodes {
        ... on Delegation {
          id
          votes
          delegator {
            id
            address
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getAddressReceivedDelegations(
  client: GraphQLClient,
  input: GetAddressReceivedDelegationsInput
): Promise<GetAddressReceivedDelegationsOutput> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      let governorId: string | undefined;

      if (input.governorId) {
        governorId = input.governorId;
      } else if (input.organizationSlug) {
        const dao = await getDAO(client, input.organizationSlug);
        if (!dao.governorIds?.length) {
          throw new Error('Organization or governor not found');
        }
        governorId = dao.governorIds[0];
      } else {
        throw new Error('Either governorId or organizationSlug is required');
      }

      const variables = {
        input: {
          filters: {
            address: input.address,
            governorId
          },
          page: input.limit ? { limit: input.limit } : undefined,
          sort: input.sortBy ? {
            field: input.sortBy,
            direction: input.isDescending ? 'DESC' : 'ASC'
          } : undefined
        }
      };

      const response = await client.request<{
        delegatees: {
          nodes: Array<{
            id: string;
            votes: string;
            delegator: {
              id: string;
              address: string;
            };
          }>;
          pageInfo: {
            firstCursor: string;
            lastCursor: string;
          };
        };
      }>(GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY, variables);

      if (!response.delegatees) {
        return {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }

      return {
        nodes: response.delegatees.nodes.map(node => ({
          id: node.id,
          votes: node.votes,
          delegator: {
            id: node.delegator.id,
            address: node.delegator.address,
          },
        })),
        pageInfo: {
          hasNextPage: !!response.delegatees.pageInfo.lastCursor,
          hasPreviousPage: !!response.delegatees.pageInfo.firstCursor,
          startCursor: response.delegatees.pageInfo.firstCursor || null,
          endCursor: response.delegatees.pageInfo.lastCursor || null,
        },
        totalCount: response.delegatees.nodes.length,
      };
    } catch (error) {
      lastError = error;
      if (error instanceof GraphQLError) {
        const graphqlError = error as GraphQLError;
        
        // Handle rate limiting (429)
        if (graphqlError.response.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle other GraphQL errors
        if (graphqlError.response.errors) {
          lastError = graphqlError.response.errors[0];
          if (lastError.message.includes('not found')) {
            return {
              nodes: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null,
              },
              totalCount: 0,
            };
          }
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch received delegations: ${lastError?.message}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 