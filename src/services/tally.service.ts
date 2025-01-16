import { GraphQLClient } from 'graphql-request';
import { listDAOs } from './organizations/listDAOs.js';
import { getDAO } from './organizations/getDAO.js';
import { listDelegates } from './delegates/listDelegates.js';
import { listProposals } from './proposals/listProposals.js';
import { getProposal } from './proposals/getProposal.js';
import type { 
  Organization,
  OrganizationsResponse,
  ListDAOsParams,
} from './organizations/organizations.types.js';
import type { Delegate } from './delegates/delegates.types.js';
import type { Delegation, GetDelegatorsParams } from './delegators/delegators.types.js';
import type { 
  ProposalsInput,
  ProposalsResponse,
  ProposalInput,
  ProposalDetailsResponse,
} from './proposals/index.js';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export class TallyService {
  private client: GraphQLClient;

  constructor(config: TallyServiceConfig) {
    this.client = new GraphQLClient(config.baseUrl || 'https://api.tally.xyz/query', {
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
    });
  }

  async listProposals(input: ProposalsInput & { organizationSlug?: string }): Promise<ProposalsResponse> {
    return listProposals(this.client, input);
  }

  async getDAO(slug: string): Promise<Organization> {
    return getDAO(this.client, slug);
  }

  async listDAOs(params: ListDAOsParams = {}): Promise<OrganizationsResponse> {
    return listDAOs(this.client, params);
  }

  async listDelegates(input: any) {
    return listDelegates(this.client, input);
  }

  async getProposal(input: ProposalInput): Promise<ProposalDetailsResponse> {
    return getProposal(this.client, input);
  }

  static formatProposal(proposal: any): string {
    return `Proposal: ${proposal.metadata.title}
ID: ${proposal.id}
Status: ${proposal.status}
Created: ${new Date(proposal.createdAt).toLocaleString()}
Description: ${proposal.metadata.description}
Governor: ${proposal.governor.name}
Vote Stats:
${proposal.voteStats.map((stat: any) => 
  `  ${stat.type}: ${stat.percent.toFixed(2)}% (${stat.votesCount} votes from ${stat.votersCount} voters)`
).join('\n')}`;
  }

  static formatProposalsList(proposals: ProposalsResponse['proposals']['nodes']): string {
    return `Found ${proposals.length} proposals:\n\n` +
      proposals.map(proposal =>
        `${proposal.metadata.title}\n` +
        `Tally ID: ${proposal.id}\n` +
        `Onchain ID: ${proposal.onchainId}\n` +
        `Status: ${proposal.status}\n` +
        `Created: ${new Date(proposal.createdAt).toLocaleString()}\n` +
        `Quorum: ${proposal.quorum}\n` +
        `Organization: ${proposal.governor.organization.name} (${proposal.governor.organization.slug})\n` +
        `Governor: ${proposal.governor.name}\n` +
        `Vote Stats:\n${proposal.voteStats.map(stat =>
          `  ${stat.type}: ${stat.percent.toFixed(2)}% (${stat.votesCount} votes from ${stat.votersCount} voters)`
        ).join('\n')}\n` +
        `Description: ${proposal.metadata.description.slice(0, 200)}${proposal.metadata.description.length > 200 ? '...' : ''}\n` +
        '---'
      ).join('\n\n');
  }
} 