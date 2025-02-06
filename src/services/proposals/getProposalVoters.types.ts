import { AccountID, IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalVotersInput {
  proposalId: string;  // Changed from IntID to string to match tool definition
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: 'id' | 'amount';  // 'id' sorts by date (default), 'amount' sorts by voting power
  isDescending?: boolean;    // true to sort in descending order
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
  block: {
    timestamp: string;
  };
}

export interface ProposalVotersResponse {
  votes: {
    nodes: ProposalVoter[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
      count: number;
    };
  };
} 