import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_CREATED_PROPOSALS_QUERY } from './addresses.queries.js';
import { getDAO } from '../organizations/getDAO.js';

export async function getAddressCreatedProposals(
  client: GraphQLClient,
  input: { address: string; organizationSlug: string }
): Promise<Record<string, any>> {
  if (!input.address) {
    throw new Error('Address is required');
  }

  if (!input.organizationSlug) {
    throw new Error('Organization slug is required');
  }

  try {
    const dao = await getDAO(client, input.organizationSlug);
    if (!dao?.governorIds?.[0]) {
      throw new Error('No governor found for organization');
    }

    const response = await client.request<Record<string, any>>(GET_ADDRESS_CREATED_PROPOSALS_QUERY, {
      input: {
        filters: {
          proposer: input.address,
          governorId: dao.governorIds[0]
        },
        page: {
          limit: 20
        }
      }
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch proposals');
  }
} 