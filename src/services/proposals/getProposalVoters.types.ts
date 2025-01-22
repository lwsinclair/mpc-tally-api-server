import { AccountID, IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalVotersInput {
  proposalId: IntID;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: 'votes' | 'timestamp';
  isDescending?: boolean;
}

// Response Types
export interface ProposalVoter {
  id: string;
  address: AccountID;
  name?: string;
  timestamp: string;
  votes: string;
  reason?: string;
  support: 'for' | 'against' | 'abstain';
  voter: {
    id: string;
    address: string;
    name?: string;
    ens?: string;
  };
  proposal: {
    id: string;
    onchainId: string;
    governor: {
      id: string;
      name: string;
    };
  };
}

export interface ProposalVotersResponse {
  proposalVoters: {
    nodes: ProposalVoter[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
} 