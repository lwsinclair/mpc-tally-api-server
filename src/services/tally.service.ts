import { GraphQLClient } from 'graphql-request';
import { getAddressProposals } from './addresses/getAddressProposals.js';
import { getAddressDAOProposals } from './addresses/getAddressDAOProposals.js';
import { getAddressVotes } from './addresses/getAddressVotes.js';
import { getAddressCreatedProposals } from './addresses/getAddressCreatedProposals.js';
import { getAddressMetadata } from './addresses/getAddressMetadata.js';
import { getAddressSafes } from './addresses/getAddressSafes.js';
import { getAddressGovernances } from './addresses/getAddressGovernances.js';
import { getAddressReceivedDelegations } from './addresses/getAddressReceivedDelegations.js';
import { getDelegateStatement } from './delegates/getDelegateStatement.js';
import { listDelegates } from './delegates/listDelegates.js';
import { ListDelegatesInput } from './delegates/delegates.types.js';
import { getProposalVoters } from './proposals/getProposalVoters.js';
import { GetProposalVotersInput, ProposalVotersResponse } from './proposals/getProposalVoters.types.js';
import { listDAOs } from './organizations/listDAOs.js';
import { ListDAOsParams, OrganizationsResponse } from './organizations/organizations.types.js';
import {
  AddressProposalsInput,
  AddressProposalsResponse,
  AddressDAOProposalsInput,
  AddressDAOProposalsResponse,
  AddressVotesInput,
  AddressVotesResponse,
  AddressCreatedProposalsInput,
  AddressCreatedProposalsResponse,
  AddressMetadataInput,
  AddressMetadataResponse,
  AddressSafesInput,
  AddressSafesResponse,
  AddressGovernancesInput,
  AddressGovernancesResponse
} from './addresses/addresses.types.js';
import { getProposalTimeline } from './proposals/getProposalTimeline.js';
import { GetProposalTimelineInput, ProposalTimelineResponse } from './proposals/getProposalTimeline.types.js';
import { getProposalSecurityAnalysis } from './proposals/getProposalSecurityAnalysis.js';
import { GetProposalSecurityAnalysisInput, ProposalSecurityAnalysisResponse } from './proposals/getProposalSecurityAnalysis.types.js';
import { getDAO } from './organizations/getDAO.js';
import { Organization } from './organizations/organizations.types.js';

export interface TallyServiceConfig {
  apiKey: string;
}

export interface AddressReceivedDelegationsInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  sortBy?: 'votes';
  isDescending?: boolean;
}

export interface AddressReceivedDelegationsOutput {
  nodes: Array<{
    id: string;
    votes: string;
    delegator: {
      id: string;
      address: string;
    };
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

export type DelegateStatementInput = {
  address: string;
} & (
  | { governorId: string; organizationSlug?: never }
  | { organizationSlug: string; governorId?: never }
);

export interface DelegateStatement {
  id: string;
  address: string;
  statement: string;
  statementSummary: string;
  isSeekingDelegation: boolean;
  issues: Array<{
    id: string;
    name: string;
  }>;
  governor?: {
    id: string;
    name: string;
    type: string;
  };
}

export class TallyService {
  private client: GraphQLClient;

  constructor(config: TallyServiceConfig) {
    this.client = new GraphQLClient('https://api.tally.xyz/query', {
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
    });
  }

  static formatDAOList(organizations: any[]): string {
    if (!organizations || organizations.length === 0) {
      return 'No DAOs found.';
    }

    return organizations
      .map(org => `- ${org.name} (${org.slug})\n  Token Owners: ${org.tokenOwnersCount || 'N/A'}\n  Proposals: ${org.proposalsCount || 'N/A'}\n  Delegates: ${org.delegatesCount || 'N/A'}`)
      .join('\n');
  }

  async getAddressProposals(input: AddressProposalsInput): Promise<AddressProposalsResponse> {
    return getAddressProposals(this.client, input);
  }

  async getAddressDAOProposals(input: AddressDAOProposalsInput): Promise<AddressDAOProposalsResponse> {
    return getAddressDAOProposals(this.client, input);
  }

  async getAddressVotes(input: AddressVotesInput): Promise<AddressVotesResponse> {
    return getAddressVotes(this.client, input);
  }

  async getAddressCreatedProposals(input: AddressCreatedProposalsInput): Promise<AddressCreatedProposalsResponse> {
    return getAddressCreatedProposals(this.client, input);
  }

  async getAddressMetadata(input: AddressMetadataInput): Promise<AddressMetadataResponse> {
    return getAddressMetadata(this.client, input);
  }

  async getAddressSafes(input: AddressSafesInput): Promise<AddressSafesResponse> {
    return getAddressSafes(this.client, input);
  }

  async getAddressGovernances(input: AddressGovernancesInput): Promise<AddressGovernancesResponse> {
    return getAddressGovernances(this.client, input);
  }

  async getAddressReceivedDelegations(input: AddressReceivedDelegationsInput): Promise<AddressReceivedDelegationsOutput> {
    return getAddressReceivedDelegations(this.client, input);
  }

  async getDelegateStatement(input: DelegateStatementInput): Promise<DelegateStatement | null> {
    return getDelegateStatement(this.client, input);
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

  async listDelegates(input: ListDelegatesInput) {
    return listDelegates(this.client, input);
  }

  async getDAO(slug: string): Promise<Organization> {
    return getDAO(this.client, slug);
  }

  async listDAOs(params: ListDAOsParams = {}): Promise<OrganizationsResponse> {
    return listDAOs(this.client, params);
  }
} 