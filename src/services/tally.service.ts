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
import { getProposalVoters } from './proposals/getProposalVoters.js';
import { GetProposalVotersInput, ProposalVotersResponse } from './proposals/getProposalVoters.types.js';
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

export interface TallyServiceConfig {
  apiKey: string;
}

export interface AddressReceivedDelegationsInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: 'id' | 'votes';
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

export interface DelegateStatementInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
}

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
        'Api-Key': config.apiKey,
      },
    });
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
} 