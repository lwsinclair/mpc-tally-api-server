import { GraphQLClient } from 'graphql-request';
import { GET_GOVERNANCE_PROPOSALS_STATS_QUERY } from './proposals.queries.js';
import type { GovernanceProposalsStatsResponse, GovernorInput } from './proposals.types.js';
import { TallyAPIError } from '../errors/apiErrors.js';

export async function getGovernanceProposalsStats(
  client: GraphQLClient,
  input: GovernorInput
): Promise<GovernanceProposalsStatsResponse> {
  try {
    return await client.request(GET_GOVERNANCE_PROPOSALS_STATS_QUERY, { input });
  } catch (error) {
    if (error instanceof Error) {
      throw new TallyAPIError(error.message);
    }
    throw new TallyAPIError('Unknown error occurred');
  }
} 