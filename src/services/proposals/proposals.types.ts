export interface ProposalStats {
  passed: number;
  failed: number;
}

export interface GovernorWithStats {
  id: string;
  chainId: string;
  proposalStats: ProposalStats;
  organization: {
    slug: string;
  };
}

export interface GovernanceProposalsStatsResponse {
  governor: GovernorWithStats;
}

export interface GovernorInput {
  id?: string;
  chainId?: string;
  organizationSlug?: string;
}

export interface GovernorsInput {
  ids?: string[];
  chainIds?: string[];
} 