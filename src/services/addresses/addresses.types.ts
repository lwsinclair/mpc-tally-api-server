import { PageInfo } from '../organizations/organizations.types.js';
import { Proposal } from '../proposals/listProposals.types.js';

export interface AddressProposalsInput {
  address: string;
  limit?: number;
  afterCursor?: string;
}

export interface AddressProposalsResponse {
  proposals: {
    nodes: Proposal[];
    pageInfo: PageInfo;
  };
}

export interface AddressDAOProposalsInput {
  address: string;
  organizationSlug: string;
  limit?: number;
  afterCursor?: string;
}

export interface AddressDAOProposalsResponse {
  proposals: {
    nodes: (Proposal & {
      participationType?: string;
    })[];
    pageInfo: PageInfo;
  };
}

export enum VoteType {
  Abstain = 'abstain',
  Against = 'against',
  For = 'for',
  PendingAbstain = 'pendingabstain',
  PendingAgainst = 'pendingagainst',
  PendingFor = 'pendingfor'
}

export interface Block {
  timestamp: string;
  number: number;
}

export interface Account {
  id: string;
  address: string;
}

export interface Vote {
  id: string;
  type: string;
  amount: string;
  voter: Account;
  proposal: {
    id: string;
  };
  block: {
    timestamp: string;
    number: string;
  };
  chainId: string;
  txHash: string;
}

export interface VotesResponse {
  nodes: Vote[];
  pageInfo: {
    firstCursor: string | null;
    lastCursor: string | null;
    count: number;
  };
}

export interface AddressVotesInput {
  address: string;
  organizationSlug: string;
  limit?: number;
  afterCursor?: string;
}

export interface AddressVotesResponse {
  votes: VotesResponse;
}

export interface AddressCreatedProposalsInput {
  address: string;
  limit?: number;
  afterCursor?: string;
}

export interface AddressCreatedProposalsResponse {
  proposals: {
    nodes: Array<{
      id: string;
      onchainId: string;
      originalId: string;
      governor: {
        id: string;
        name: string;
        organization: {
          id: string;
          name: string;
          slug: string;
        };
      };
      metadata: {
        title: string;
        description: string;
      };
      status: string;
      createdAt: string;
      block: {
        timestamp: string;
      };
      proposer: {
        address: string;
        name: string | null;
      };
      voteStats: {
        votesCount: string;
        votersCount: string;
        type: string;
        percent: string;
      };
    }>;
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
}

export interface AddressMetadataInput {
  address: string;
}

export interface AddressAccount {
  id: string;
  address: string;
  ens?: string;
  name?: string;
  bio?: string;
  picture?: string;
}

export interface AddressMetadataResponse {
  address: string;
  accounts: AddressAccount[];
}

export interface AddressSafesInput {
  address: string;
}

export interface AddressSafesResponse {
  account: {
    safes: string[];
  };
}

export interface AddressGovernancesInput {
  address: string;
}

export interface AddressGovernance {
  id: string;
  name: string;
  type: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    metadata: {
      icon: string | null;
    };
  };
  stats: {
    proposalsCount: number;
    delegatesCount: number;
    tokenHoldersCount: number;
  };
  tokens: Array<{
    id: string;
    name: string;
    symbol: string;
    decimals: number;
  }>;
}

export interface AddressGovernancesResponse {
  account: {
    delegatedGovernors: AddressGovernance[];
  };
}

export interface GetAddressReceivedDelegationsInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  sortBy?: "votes";
  isDescending?: boolean;
}

export interface DelegationNode {
  id: string;
  votes: string;
  delegator: {
    id: string;
    address: string;
  };
}

export interface GetAddressReceivedDelegationsOutput {
  nodes: DelegationNode[];
  pageInfo: PageInfo;
  totalCount: number;
} 