import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_DAO_PROPOSALS_QUERY } from './addresses.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import { AddressDAOProposalsInput, AddressDAOProposalsResponse } from './addresses.types.js';

export async function getAddressDAOProposals(
  client: GraphQLClient,
  input: AddressDAOProposalsInput
): Promise<AddressDAOProposalsResponse> {
  try {
    if (!input.address) {
      throw new Error('Address is required');
    }

    if (!input.governorId && !input.organizationSlug) {
      throw new Error('Either governorId or organizationSlug is required');
    }

    // Get governorId from organizationSlug if provided
    let governorId = input.governorId;
    if (!governorId && input.organizationSlug) {
      const dao = await getDAO(client, input.organizationSlug);
      if (dao.governorIds && dao.governorIds.length > 0) {
        governorId = dao.governorIds[0];
      } else {
        throw new Error('No governor IDs found for the given organization');
      }
    }

    const response = await client.request<AddressDAOProposalsResponse>(GET_ADDRESS_DAO_PROPOSALS_QUERY, {
      input: {
        filters: {
          governorId
        },
        pagination: {
          limit: input.limit || 20,
          afterCursor: input.afterCursor
        }
      },
      address: input.address
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch DAO proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 