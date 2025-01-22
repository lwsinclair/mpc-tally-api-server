import { GraphQLClient } from 'graphql-request';
import { LIST_PROPOSALS_QUERY } from './proposals.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import type { ProposalsInput, ProposalsResponse, ListProposalsParams } from './listProposals.types.js';

export async function listProposals(
  client: GraphQLClient,
  params: ListProposalsParams
): Promise<ProposalsResponse> {
  try {
    // Get the DAO first to get its ID
    const { organization: dao } = await getDAO(client, params.slug);

    const apiInput: ProposalsInput = {
      filters: {
        organizationId: dao.id,
        includeArchived: params.includeArchived,
        isDraft: params.isDraft
      },
      page: {
        limit: params.limit || 50, // Default to maximum
        afterCursor: params.afterCursor,
        beforeCursor: params.beforeCursor
      },
      ...(typeof params.isDescending === 'boolean' && {
        sort: {
          isDescending: params.isDescending,
          sortBy: "id"
        }
      })
    };

    const response = await client.request<ProposalsResponse>(LIST_PROPOSALS_QUERY, { input: apiInput });
    
    if (!response?.proposals?.nodes) {
      throw new Error('Invalid response structure from API');
    }

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 