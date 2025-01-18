import { GraphQLClient } from 'graphql-request';
import { GET_PROPOSAL_QUERY } from './proposals.queries.js';
import type { ProposalInput, ProposalDetailsResponse, GetProposalResponse } from './getProposal.types.js';
import { getDAO } from '../organizations/getDAO.js';

export async function getProposal(
  client: GraphQLClient,
  input: ProposalInput & { organizationSlug?: string }
): Promise<GetProposalResponse> {
  try {
    let apiInput: ProposalInput = { ...input };
    delete (apiInput as any).organizationSlug;  // Remove organizationSlug before API call

    // If organizationSlug is provided but no organizationId, get the DAO first
    if (input.organizationSlug && !apiInput.governorId) {
      const dao = await getDAO(client, input.organizationSlug);
      // Use the first governor ID from the DAO
      if (dao.governorIds && dao.governorIds.length > 0) {
        apiInput.governorId = dao.governorIds[0];
      }
    }

    // Ensure ID is not wrapped in quotes if it's numeric
    if (apiInput.id && typeof apiInput.id === 'string' && /^\d+$/.test(apiInput.id)) {
      apiInput = {
        ...apiInput,
        id: apiInput.id.replace(/['"]/g, '') // Remove any quotes
      };
    }

    const response = await client.request<GetProposalResponse>(GET_PROPOSAL_QUERY, { input: apiInput });
    if (!response?.data?.proposal) {
      throw new Error('Invalid response structure from API');
    }
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 