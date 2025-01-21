import { GraphQLClient } from 'graphql-request';
import { getDAO } from './organizations/getDAO.js';
import { listDAOs } from './organizations/listDAOs.js';
import { getDAOProposals } from './organizations/getDAOProposals.js';
import { getAddressProposals } from './addresses/getAddressProposals.js';
import { getAddressDAOProposals } from './addresses/getAddressDAOProposals.js';
import { getAddressVotes } from './addresses/getAddressVotes.js';
import { getAddressCreatedProposals } from './addresses/getAddressCreatedProposals.js';
import { getAddressMetadata } from './addresses/getAddressMetadata.js';
import { getAddressGovernances } from './addresses/getAddressGovernances.js';
import { getAddressReceivedDelegations } from './addresses/getAddressReceivedDelegations.js';
import { getDelegateStatement } from './delegates/getDelegateStatement.js';
import { getDelegators } from './delegators/getDelegators.js';
import type { 
  Organization,
  OrganizationsResponse,
  ListDAOsParams,
  PageInfo,
  Token,
} from './organizations/organizations.types.js';
import type { Delegate } from './delegates/delegates.types.js';
import type { Delegation, GetDelegatorsParams, TokenInfo } from './delegators/delegators.types.js';
import type { GetAddressReceivedDelegationsInput } from './addresses/addresses.types.js';
import type { DelegateStatement } from './delegates/delegates.types.js';
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
  AddressMetadataInput,
  AddressMetadataResponse,
  AddressGovernancesInput,
  AddressGovernancesResponse,
} from './addresses/addresses.types.js';
import { getDAOTokens } from './organizations/getDAO.js';
import { getProposalVotesCast } from './proposals/getProposalVotesCast.js';
import { getProposalVotesCastList } from './proposals/getProposalVotesCastList.js';
import { getGovernanceProposalsStats } from './proposals/getGovernanceProposalsStats.js';
import type {
  GetProposalVotesCastInput,
  ProposalVotesCastResponse,
} from './proposals/getProposalVotesCast.types.js';
import type {
  GetProposalVotesCastListInput,
  ProposalVotesCastListResponse,
} from './proposals/getProposalVotesCastList.types.js';
import type {
  GovernorInput,
  GovernanceProposalsStatsResponse,
} from './proposals/proposals.types.js';
import type { ListProposalsParams } from './proposals/listProposals.types.js';
import { listProposals } from './proposals/listProposals.js';
import { getProposal } from './proposals/getProposal.js';
import { getProposalVoters } from './proposals/getProposalVoters.js';
import { getProposalTimeline } from './proposals/getProposalTimeline.js';
import { getProposalSecurityAnalysis } from './proposals/getProposalSecurityAnalysis.js';
import { listDelegates } from './delegates/listDelegates.js';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface GetAddressReceivedDelegationsOutput {
  nodes: Array<{
    id: string;
    votes: string;
    delegator: {
      id: string;
      address: string;
    };
  }>;
  pageInfo: {
    firstCursor: string | null;
    lastCursor: string | null;
    count: number;
  };
  totalCount: number;
}

export type GetDelegateStatementInput = {
  address: string;
} & (
  | { governorId: string; organizationSlug?: never }
  | { organizationSlug: string; governorId?: never }
);

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

  async listProposals(params: ListProposalsParams): Promise<ProposalsResponse> {
    return listProposals(this.client, params);
  }

  async getDAO(slug: string): Promise<Organization> {
    return getDAO(this.client, slug);
  }

  async getDAOTokens(tokenIds: string[]): Promise<Token[]> {
    return getDAOTokens(this.client, tokenIds);
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

  async getAddressMetadata(input: AddressMetadataInput):Promise<Record<string, any>> {
    if (!input.address) {
      throw new Error('Address is required');
    }
    return getAddressMetadata(this.client, input);
  }

  async getAddressGovernances(input: AddressGovernancesInput): Promise<AddressGovernancesResponse> {
    if (!input.address) {
      throw new Error('Address is required');
    }
    return getAddressGovernances(this.client, input);
  }

  async getAddressReceivedDelegations(input: GetAddressReceivedDelegationsInput): Promise<GetAddressReceivedDelegationsOutput> {
    if (!input.address) {
      throw new Error('address is required');
    }
    return getAddressReceivedDelegations(this.client, input);
  }

  async getDelegateStatement(input: GetDelegateStatementInput): Promise<DelegateStatement | null> {
    return getDelegateStatement(this.client, input);
  }

  async getDelegators(params: GetDelegatorsParams): Promise<{
    delegators: Delegation[];
    pageInfo: PageInfo;
  }> {
    if (!params.address) {
      throw new Error('address is required');
    }
    return getDelegators(this.client, params);
  }

  async getProposalVotesCast(input: GetProposalVotesCastInput): Promise<ProposalVotesCastResponse> {
    if (!input.id) {
      throw new Error('proposalId is required');
    }
    return getProposalVotesCast(this.client, input);
  }

  async getProposalVotesCastList(input: GetProposalVotesCastListInput): Promise<ProposalVotesCastListResponse> {
    return getProposalVotesCastList(this.client, input);
  }

  async getGovernanceProposalsStats(input: { slug: string }): Promise<GovernanceProposalsStatsResponse> {
    return getGovernanceProposalsStats(this.client, input);
  }

  /**
   * Format a vote amount considering token decimals
   * @param {string} votes - The raw vote amount
   * @param {TokenInfo} token - Optional token info containing decimals and symbol
   * @returns {string} Formatted vote amount with optional symbol
   */
  private static formatVotes(votes: string, token?: TokenInfo): string {
    const val = BigInt(votes);
    const decimals = token?.decimals ?? 18;
    const denominator = BigInt(10 ** decimals);
    const formatted = (Number(val) / Number(denominator)).toLocaleString();
    return `${formatted}${token?.symbol ? ` ${token.symbol}` : ''}`;
  }

  static formatDAOList(daos: Organization[]): string {
    return `Found ${daos.length} DAOs:\n\n` + 
      daos.map(dao => 
        `${dao.name} (${dao.slug})\n` +
        `Token Holders: ${dao.tokenOwnersCount}\n` +
        `Delegates: ${dao.delegatesCount}\n` +
        `Proposals: ${dao.proposalsCount}\n` +
        `Active Proposals: ${dao.hasActiveProposals ? 'Yes' : 'No'}\n` +
        `Description: ${dao.metadata?.description || 'No description available'}\n` +
        `Website: ${dao.metadata?.socials?.website || 'N/A'}\n` +
        `Twitter: ${dao.metadata?.socials?.twitter || 'N/A'}\n` +
        `Discord: ${dao.metadata?.socials?.discord || 'N/A'}\n` +
        '---'
      ).join('\n\n');
  }

  static formatDAO(dao: Organization): string {
    return `${dao.name} (${dao.slug})\n` +
      `Token Holders: ${dao.tokenOwnersCount}\n` +
      `Delegates: ${dao.delegatesCount}\n` +
      `Proposals: ${dao.proposalsCount}\n` +
      `Active Proposals: ${dao.hasActiveProposals ? 'Yes' : 'No'}\n` +
      `Description: ${dao.metadata?.description || 'No description available'}\n` +
      `Website: ${dao.metadata?.socials?.website || 'N/A'}\n` +
      `Twitter: ${dao.metadata?.socials?.twitter || 'N/A'}\n` +
      `Discord: ${dao.metadata?.socials?.discord || 'N/A'}\n` +
      `Chain IDs: ${dao.chainIds.join(', ')}\n` +
      `Token IDs: ${dao.tokenIds?.join(', ') || 'N/A'}\n` +
      `Governor IDs: ${dao.governorIds?.join(', ') || 'N/A'}`;
  }

  static formatDelegatesList(delegates: Delegate[]): string {
    return `Found ${delegates.length} delegates:\n\n` +
      delegates.map(delegate =>
        `${delegate.account.name || delegate.account.address}\n` +
        `Address: ${delegate.account.address}\n` +
        `Votes: ${delegate.votesCount}\n` +
        `Delegators: ${delegate.delegatorsCount}\n` +
        `Bio: ${delegate.account.bio || 'No bio available'}\n` +
        `Statement: ${delegate.statement?.statementSummary || 'No statement available'}\n` +
        '---'
      ).join('\n\n');
  }

  static formatDelegatorsList(delegators: Delegation[]): string {
    return `Found ${delegators.length} delegators:\n\n` +
      delegators.map(delegation =>
        `${delegation.delegator.name || delegation.delegator.ens || delegation.delegator.address}\n` +
        `Address: ${delegation.delegator.address}\n` +
        `Votes: ${TallyService.formatVotes(delegation.votes, delegation.token)}\n` +
        `Delegated at: Block ${delegation.blockNumber} (${new Date(delegation.blockTimestamp).toLocaleString()})\n` +
        `${delegation.token ? `Token: ${delegation.token.symbol} (${delegation.token.name})\n` : ''}` +
        '---'
      ).join('\n\n');
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

  static formatProposalsList(proposals: any[]): string {
    return `Found ${proposals.length} proposals:\n\n` +
      proposals.map(proposal =>
        `${proposal.metadata.title}\n` +
        `Tally ID: ${proposal.id}\n` +
        `Status: ${proposal.status}\n` +
        `Created: ${new Date(proposal.createdAt).toLocaleString()}\n\n`
      ).join('');
  }
} 