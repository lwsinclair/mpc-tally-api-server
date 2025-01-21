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

export interface ProposalVotesCastGovernor {
  quorum: string;
  token: {
    decimals: number;
  };
  type: string;
  id: string;
}

export interface ProposalVotesCast {
  onchainId: string;
  status: "active" | "canceled" | "defeated" | "executed" | "expired" | "pending" | "queued" | "succeeded";
  quorum: string;
  voteStats: ProposalVotesCastVoteStats[];
  governor: ProposalVotesCastGovernor;
}

export interface ProposalVotesCastResponse {
  proposal: ProposalVotesCast | null;
} 