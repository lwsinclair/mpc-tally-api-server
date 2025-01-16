import { GraphQLClient } from 'graphql-request';
import { listDAOs } from './organizations/listDAOs.js';
import { getDAO } from './organizations/getDAO.js';
import { listDelegates } from './delegates/listDelegates.js';
import { listProposals } from './proposals/listProposals.js';
import { getProposal } from './proposals/getProposal.js';
import { getProposalVoters } from './proposals/getProposalVoters.js';
import { getProposalTimeline } from './proposals/getProposalTimeline.js';
import { getProposalSecurityAnalysis } from './proposals/getProposalSecurityAnalysis.js';
import { getAddressProposals } from './addresses/getAddressProposals.js';
import { getAddressDAOProposals } from './addresses/getAddressDAOProposals.js';
import { getAddressVotes } from './addresses/getAddressVotes.js';
import { getAddressCreatedProposals } from './addresses/getAddressCreatedProposals.js';
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
import type {
  GetProposalVotersInput,
  ProposalVotersResponse,
} from './proposals/getProposalVoters.types.js';
import type {
  GetProposalTimelineInput,
  ProposalTimelineResponse,
} from './proposals/getProposalTimeline.types.js';
import type {
  GetProposalSecurityAnalysisInput,
  ProposalSecurityAnalysisResponse,
} from './proposals/getProposalSecurityAnalysis.types.js';
import type {
  AddressProposalsInput,
  AddressProposalsResponse,
  AddressDAOProposalsInput,
  AddressDAOProposalsResponse,
  AddressVotesInput,
  AddressVotesResponse,
  AddressCreatedProposalsInput,
  AddressCreatedProposalsResponse,
} from './addresses/addresses.types.js';

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

  async getProposalVoters(input: GetProposalVotersInput): Promise<ProposalVotersResponse> {
    if (!input.proposalId) {
      throw new Error('proposalId is required');
    }
    return getProposalVoters(this.client, input);
  }

  async getProposalTimeline(input: GetProposalTimelineInput): Promise<ProposalTimelineResponse> {
    if (!input.proposalId) {
      throw new Error('proposalId is required');
    }
    return getProposalTimeline(this.client, input);
  }

  async getProposalSecurityAnalysis(input: GetProposalSecurityAnalysisInput): Promise<ProposalSecurityAnalysisResponse> {
    if (!input.proposalId) {
      throw new Error('proposalId is required');
    }
    return getProposalSecurityAnalysis(this.client, input);
  }

  async getAddressProposals(input: AddressProposalsInput): Promise<AddressProposalsResponse> {
    if (!input.address) {
      throw new Error('address is required');
    }
    return getAddressProposals(this.client, input);
  }

  async getAddressDAOProposals(input: AddressDAOProposalsInput): Promise<AddressDAOProposalsResponse> {
    if (!input.address) {
      throw new Error('Address is required');
    }
    return getAddressDAOProposals(this.client, input);
  }

  async getAddressVotes(input: AddressVotesInput): Promise<AddressVotesResponse> {
    if (!input.address) {
      throw new Error('address is required');
    }
    if (!input.organizationSlug) {
      throw new Error('organizationSlug is required');
    }
    return getAddressVotes(this.client, input);
  }

  async getAddressCreatedProposals(input: AddressCreatedProposalsInput): Promise<AddressCreatedProposalsResponse> {
    if (!input.address) {
      throw new Error('address is required');
    }
    return getAddressCreatedProposals(this.client, input);
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
        `Status: ${proposal.status}\n` +
        `Created: ${new Date(proposal.createdAt).toLocaleString()}\n\n`
      ).join('');
  }
} 