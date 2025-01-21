import { IntID } from './listProposals.types.js';
import { FormattedTokenAmount } from '../../utils/formatTokenAmount.js';

// Input Types
export interface GetProposalVotesCastInput {
  id: IntID;
}

// Response Types
export interface ProposalVotesCastVoteStats {
  votesCount: string;
  formattedVotesCount: FormattedTokenAmount;
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

export interface ProposalVotesCastOrganizationMetadata {
  icon: string | null;
}

export interface ProposalVotesCastOrganization {
  name: string;
  slug: string;
  metadata: ProposalVotesCastOrganizationMetadata;
}

export interface ProposalVotesCastGovernor {
  id: string;
  type: string;
  quorum: string;
  token: ProposalVotesCastToken;
  organization: ProposalVotesCastOrganization;
}

export interface ProposalVotesCastMetadata {
  title: string | null;
  description: string | null;
}

export interface ProposalVotesCast {
  id: string;
  onchainId: string;
  status: "active" | "canceled" | "defeated" | "executed" | "expired" | "pending" | "queued" | "succeeded";
  quorum: string;
  createdAt: string;
  metadata: ProposalVotesCastMetadata;
  voteStats: ProposalVotesCastVoteStats[];
  governor: ProposalVotesCastGovernor;
}

export interface ProposalVotesCastResponse {
  proposal: ProposalVotesCast | null;
} 