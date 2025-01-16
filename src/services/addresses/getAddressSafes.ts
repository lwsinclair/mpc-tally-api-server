import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_SAFES_QUERY } from './addresses.queries.js';
import { AddressSafesInput, AddressSafesResponse } from './addresses.types.js';

export async function getAddressSafes(
  client: GraphQLClient,
  input: AddressSafesInput
): Promise<AddressSafesResponse> {
  if (!input.address) {
    throw new Error('Address is required');
  }

  try {
    const accountId = `eip155:1:${input.address.toLowerCase()}`;

    const response = await client.request<AddressSafesResponse>(GET_ADDRESS_SAFES_QUERY, {
      accountId
    });

    if (!response || !response.account) {
      throw new Error('Failed to fetch address safes');
    }

    if (response.account.safes === null) {
      response.account.safes = [];
    }

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch address safes: ${error.message}`);
  }
} 