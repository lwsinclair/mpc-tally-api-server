export interface Proposal {
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
    number: string;
  };
  proposer: {
    address: string;
    name?: string;
  };
  voteStats: Array<{
    votesCount: string;
    votersCount: string;
    type: string;
    percent: number;
  }>;
}

export interface ProposalsResponse {
  proposals: {
    nodes: Proposal[];
    pageInfo: {
      firstCursor: string | null;
      lastCursor: string | null;
      count: number;
    };
  };
}

export interface ProposalsInput {
  filters?: {
    organizationId?: string;
    governorId?: string;
    includeArchived?: boolean;
    isDraft?: boolean;
  };
  page?: {
    limit?: number;
    afterCursor?: string;
    beforeCursor?: string;
  };
  sort?: {
    isDescending?: boolean;
    sortBy?: string;
  };
}

export interface ProposalInput {
  id?: string;
  onchainId?: string;
  governorId?: string;
  includeArchived?: boolean;
  isLatest?: boolean;
}

export type ProposalDetailsResponse = {
  proposal: Proposal;
}; 