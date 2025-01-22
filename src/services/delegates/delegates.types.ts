import { PageInfo } from '../organizations/organizations.types.js';

// Input Types
export interface ListDelegatesInput {
  organizationId?: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  hasVotes?: boolean;
  hasDelegators?: boolean;
  isSeekingDelegation?: boolean;
  sortBy?: 'id' | 'votes';
  isDescending?: boolean;
}

// Response Types
export interface Delegate {
  id: string;
  account: {
    address: string;
    bio?: string;
    name?: string;
    picture?: string | null;
    twitter?: string;
    ens?: string;
    otherLinks?: string[];
    email?: string;
  };
  votesCount: string;
  delegatorsCount: number;
  statement?: {
    statementSummary?: string;
    discourseUsername?: string;
    discourseProfileLink?: string;
  };
}

export interface DelegatesResponse {
  delegates: {
    nodes: Delegate[];
    pageInfo: PageInfo;
  };
}

export interface ListDelegatesResponse {
  data: DelegatesResponse;
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

export interface DelegateStatement {
  id: string;
  address: string;
  statement: string;
  statementSummary: string;
  isSeekingDelegation: boolean;
  issues: Array<{
    id: string;
    name: string;
  }>;
  governor?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface GetDelegateStatementInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
} 