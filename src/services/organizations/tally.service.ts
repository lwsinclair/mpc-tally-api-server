import { Organization, OrganizationsInput } from './organizations.types';
import { LIST_DAOS_QUERY, GET_DAO_QUERY } from './organizations.queries';
import { formatDAO } from './organizations.service';
import { GraphQLClient } from 'graphql-request';

export class TallyService {
  private client: GraphQLClient;
  public formatDAO: typeof formatDAO;

  constructor(endpoint: string, apiKey: string) {
    this.client = new GraphQLClient(endpoint, {
      headers: {
        'Api-Key': apiKey,
      },
    });
    this.formatDAO = formatDAO;
  }

  async getDAO(slug: string): Promise<Organization> {
    try {
      const variables = {
        input: { slug }
      };
      
      const response = await this.client.request(GET_DAO_QUERY, variables);
      
      if (!response.organization) {
        throw new Error(`Organization not found: ${slug}`);
      }

      return this.formatDAO(response.organization);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching DAO: ${message}`);
    }
  }

  async listDAOs(input: OrganizationsInput): Promise<Organization[]> {
    try {
      const response = await this.client.request(LIST_DAOS_QUERY, { input });
      
      return response.organizations.nodes.map((node) => this.formatDAO(node));
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