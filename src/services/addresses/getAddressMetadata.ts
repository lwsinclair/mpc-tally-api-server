import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_METADATA_QUERY } from './addresses.queries.js';
import { AddressMetadataInput, AddressMetadataResponse } from './addresses.types.js';

export async function getAddressMetadata(
  client: GraphQLClient,
  input: AddressMetadataInput
): Promise<AddressMetadataResponse> {
  if (!input.address) {
    throw new Error('Address is required');
  }

  try {
    const response = await client.request<{ address: AddressMetadataResponse }>(
      GET_ADDRESS_METADATA_QUERY,
      { address: input.address }
    );

    if (!response.address) {
      throw new Error('Failed to fetch address metadata');
    }

    return response.address;
  } catch (error) {
    throw new Error(`Failed to fetch address metadata: ${error.message}`);
  }
} 