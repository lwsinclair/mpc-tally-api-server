import { FormattedTokenAmount } from '../../utils/formatTokenAmount.js';

export interface VoteBlock {
  id: string;
  timestamp: string;
}

export interface Voter {
  name: string | null;
  picture: string | null;
  address: string;
  twitter: string | null;
}

export interface Vote {
  id: string;
  isBridged: boolean;
  voter: Voter;
  amount: string;
  formattedAmount: FormattedTokenAmount;
  reason: string | null;
  type: 'for' | 'against' | 'abstain' | 'pendingfor' | 'pendingagainst' | 'pendingabstain';
  chainId: string;
  block: VoteBlock;
}

export interface PageInfo {
  firstCursor: string;
  lastCursor: string;
  count: number;
}

export interface VoteList {
  nodes: Vote[];
  pageInfo: PageInfo;
}

export interface ProposalVotesCastListResponse {
  forVotes: VoteList;
  againstVotes: VoteList;
  abstainVotes: VoteList;
}

export interface GetProposalVotesCastListInput {
  id: string;
  page?: {
    cursor?: string;
    limit?: number;
  };
} 