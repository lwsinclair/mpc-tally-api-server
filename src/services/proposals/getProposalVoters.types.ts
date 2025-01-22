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
  type: 'for' | 'against' | 'abstain';
  voter: {
    address: string;
    name?: string;
  };
  amount: string;
}

export interface ProposalVotersResponse {
  votes: {
    nodes: ProposalVoter[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
} 