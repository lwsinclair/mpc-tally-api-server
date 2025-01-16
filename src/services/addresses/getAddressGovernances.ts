import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_GOVERNANCES_QUERY } from './addresses.queries.js';
import { AddressGovernancesInput, AddressGovernancesResponse } from './addresses.types.js';

export async function getAddressGovernances(
  client: GraphQLClient,
  input: AddressGovernancesInput
): Promise<AddressGovernancesResponse> {
  if (!input.address) {
    throw new Error('Address is required');
  }

  try {
    const accountId = `eip155:1:${input.address.toLowerCase()}`;
    const response = await client.request<AddressGovernancesResponse>(
      GET_ADDRESS_GOVERNANCES_QUERY,
      {
        accountId
      }
    );

    if (!response?.account?.delegatedGovernors) {
      throw new Error('Failed to fetch address governances');
    }

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch address governances: ${error.message}`);
  }
} 