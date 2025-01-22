import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_DAO_PROPOSALS_QUERY } from './addresses.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import { AddressDAOProposalsInput } from './addresses.types.js';

export async function getAddressDAOProposals(
  client: GraphQLClient,
  input: AddressDAOProposalsInput
): Promise<Record<string, any>> {
  try {
    if (!input.address) {
      throw new Error('Address is required');
    }

    if (!input.organizationSlug) {
      throw new Error('organizationSlug is required');
    }

    // Get governorId from organizationSlug
    const { organization: dao } = await getDAO(client, input.organizationSlug);
    if (!dao.governorIds?.length) {
      throw new Error('No governor IDs found for the given organization');
    }
    const governorId = dao.governorIds[0];

    const response = await client.request(
      GET_ADDRESS_DAO_PROPOSALS_QUERY,
      {
        input: {
          filters: {
            governorId
          },
          page: {
            limit: input.limit || 20,
            afterCursor: input.afterCursor
          }
        },
        address: input.address
      }
    ) as Record<string, any>;

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch DAO proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 