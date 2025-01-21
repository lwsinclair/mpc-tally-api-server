export interface ProposalStats {
  passed: number;
  failed: number;
}

export interface GovernorWithStats {
  id: string;
  chainId: string;
  proposalStats: ProposalStats;
}

export interface GovernanceProposalsStatsResponse {
  governor: GovernorWithStats;
}

export interface GovernorInput {
  id?: string;
  chainId?: string;
}

export interface GovernorsInput {
  ids?: string[];
  chainIds?: string[];
} 