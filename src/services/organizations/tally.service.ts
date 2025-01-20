import { OrganizationsInput } from './organizations.types';
import { LIST_DAOS_QUERY, GET_DAO_QUERY } from './organizations.queries';
import { GraphQLClient } from 'graphql-request';

export class TallyService {
  private client: GraphQLClient;

  constructor(endpoint: string, apiKey: string) {
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'Api-Key': apiKey,
      },
    });
  }

  async getDAO(slug: string): Promise<Record<string, any>> {
    try {
      const variables = {
        input: { slug }
      };
      
      const response = await this.client.request<{ organization: Record<string, any> }>(GET_DAO_QUERY, variables);
      
      if (!response.organization) {
        throw new Error(`Organization not found: ${slug}`);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching DAO: ${message}`);
    }
  }

  async listDAOs(input: OrganizationsInput): Promise<Record<string, any>> {
    try {
      const response = await this.client.request<{ organizations: Record<string, any> }>(LIST_DAOS_QUERY, { input });
      
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching DAOs: ${message}`);
    }
  }
}

// Export a singleton instance
export const tallyService = new TallyService(
  process.env.TALLY_API_ENDPOINT || 'https://api.tally.xyz/query',
  process.env.TALLY_API_KEY || ''
); 