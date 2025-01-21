import { GraphQLClient } from 'graphql-request';
import { GET_GOVERNANCE_PROPOSALS_STATS_QUERY } from './proposals.queries.js';
import type { GovernanceProposalsStatsResponse, GovernorInput } from './proposals.types.js';
import { TallyAPIError } from '../errors/apiErrors.js';
import { getDAO } from '../organizations/getDAO.js';

export async function getGovernanceProposalsStats(
  client: GraphQLClient,
  input: { slug: string }
): Promise<GovernanceProposalsStatsResponse> {
  try {
    // First get the DAO to get the governor ID
    const { organization: dao } = await getDAO(client, input.slug);
    if (!dao.governorIds?.[0]) {
      throw new TallyAPIError('No governor found for this DAO');
    }

    // Then get the stats using the governor ID
    return await client.request(GET_GOVERNANCE_PROPOSALS_STATS_QUERY, { 
      input: { id: dao.governorIds[0] }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new TallyAPIError(error.message);
    }
    throw new TallyAPIError('Unknown error occurred');
  }
} 