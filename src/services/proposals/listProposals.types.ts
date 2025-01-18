// Basic Types
export type AccountID = string;
export type IntID = string;

// Input Types
export interface ProposalsInput {
  filters?: {
    governorId?: AccountID;
    organizationId?: IntID;
    includeArchived?: boolean;
    isDraft?: boolean;
  };
  page?: {
    afterCursor?: string;
    beforeCursor?: string;
    limit?: number; // max 50
  };
  sort?: {
    isDescending: boolean;
    sortBy: "id"; // default sorts by date
  };
}

export interface ListProposalsVariables {
  input: ProposalsInput;
}

// Helper Types
export interface ExecutableCall {
  value: string;
  target: string;
  calldata: string;
  signature: string;
  type: string;
}

export interface ProposalMetadata {
  description: string;
  title: string;
  discourseURL: string | null;
  snapshotURL: string | null;
}

export interface TimeBlock {
  timestamp: string;
}

export interface VoteStat {
  votesCount: string;
  percent: number;
  type: string;
  votersCount: number;
}

export interface ProposalGovernor {
  id: string;
  chainId: string;
  name: string;
  token: {
    decimals: number;
  };
  organization: {
    name: string;
    slug: string;
  };
}

export interface ProposalProposer {
  address: string;
  name: string;
  picture: string | null;
}

// Main Types
export interface Proposal {
  id: string;
  onchainId: string;
  status: string;
  createdAt: string;
  quorum: string;
  metadata: ProposalMetadata;
  start: TimeBlock;
  end: TimeBlock;
  executableCalls: ExecutableCall[];
  voteStats: VoteStat[];
  governor: ProposalGovernor;
  proposer: ProposalProposer;
  block?: {
    timestamp: string;
    number: string;
  };
  originalId?: string;
}

export interface ProposalsResponse {
  proposals: {
    nodes: Proposal[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
}

export interface ListProposalsResponse {
  data: ProposalsResponse;
  errors?: Array<{
    message: string;
    path: string[];
    extensions: {
      code: number;
      status: {
        code: number;
        message: string;
      };
    };
  }>;
} 