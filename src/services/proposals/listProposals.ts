import { GraphQLClient } from 'graphql-request';
import { LIST_PROPOSALS_QUERY } from './proposals.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import type { ProposalsInput, ProposalsResponse } from './listProposals.types.js';

export async function listProposals(
  client: GraphQLClient,
  input: ProposalsInput & { organizationSlug?: string }
): Promise<ProposalsResponse> {
  try {
    let apiInput: ProposalsInput = { ...input };
    delete (apiInput as any).organizationSlug;  // Remove organizationSlug before API call

    // If organizationSlug is provided but no organizationId, get the DAO first
    if (!apiInput.filters?.organizationId && input.organizationSlug) {
      const dao = await getDAO(client, input.organizationSlug);
      apiInput = {
        ...apiInput,
        filters: {
          ...apiInput.filters,
          organizationId: dao.id
        }
      };
    }

    console.log('Sending proposals request with input:', JSON.stringify(apiInput, null, 2));
    const response = await client.request<{ data: ProposalsResponse }>(LIST_PROPOSALS_QUERY, { input: apiInput });
    console.log('Raw proposals response:', JSON.stringify(response, null, 2));

    if (!response?.data?.proposals) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid response structure from API');
    }

    return response.data;
  } catch (error) {
    console.error('Error in listProposals:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 