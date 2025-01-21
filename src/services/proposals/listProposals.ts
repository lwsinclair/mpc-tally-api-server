import { GraphQLClient } from 'graphql-request';
import { LIST_PROPOSALS_QUERY } from './proposals.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import type { ProposalsInput, ProposalsResponse } from './listProposals.types.js';
import { inspect } from 'util';

// Helper function to get object structure
function getObjectStructure(obj: any): any {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) {
    return obj.length ? [getObjectStructure(obj[0])] : '[]';
  }
  if (typeof obj === 'object') {
    const structure: Record<string, any> = {};
    for (const key in obj) {
      structure[key] = getObjectStructure(obj[key]);
    }
    return structure;
  }
  return typeof obj;
}

export async function listProposals(
  client: GraphQLClient,
  input: ProposalsInput & { organizationSlug?: string }
): Promise<ProposalsResponse> {
  try {
    let apiInput: ProposalsInput = { ...input };
    delete (apiInput as any).organizationSlug;  // Remove organizationSlug before API call

    // If organizationSlug is provided but no organizationId, get the DAO first
    if (!apiInput.filters?.organizationId && input.organizationSlug) {
      const { organization: dao } = await getDAO(client, input.organizationSlug);
      apiInput = {
        ...apiInput,
        filters: {
          ...apiInput.filters,
          organizationId: dao.id
        }
      };
    }

    const response = await client.request<ProposalsResponse>(LIST_PROPOSALS_QUERY, { input: apiInput });
    

    if (!response?.proposals?.nodes) {
      console.error('Invalid response structure:', inspect(getObjectStructure(response), { colors: true }));
      throw new Error('Invalid response structure from API');
    }

    return response;
  } catch (error) {
    console.error('Error in listProposals:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 