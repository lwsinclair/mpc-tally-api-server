import { IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalVotesCastInput {
  id: IntID;
}

// Response Types
export interface ProposalVotesCastVoteStats {
  votesCount: string;
  votersCount: number;
  type: "for" | "against" | "abstain" | "pendingfor" | "pendingagainst" | "pendingabstain";
  percent: number;
}

export interface ProposalVotesCastToken {
  decimals: number;
  supply: string;
  symbol: string;
  name: string;
}

export interface ProposalVotesCastOrganization {
  name: string;
  slug: string;
  metadata: {
    icon: string | null;
  };
}

export interface ProposalVotesCastGovernor {
  id: string;
  type: string;
  quorum: string;
  token: ProposalVotesCastToken;
  organization: ProposalVotesCastOrganization;
}

export interface ProposalVotesCast {
  id: string;
  onchainId: string;
  status: "active" | "canceled" | "defeated" | "executed" | "expired" | "pending" | "queued" | "succeeded";
  quorum: string;
  createdAt: string;
  metadata: {
    title: string | null;
    description: string | null;
  };
  voteStats: ProposalVotesCastVoteStats[];
  governor: ProposalVotesCastGovernor;
}

export interface ProposalVotesCastResponse {
  proposal: ProposalVotesCast | null;
} 