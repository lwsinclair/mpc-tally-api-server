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
  address: string;
  name?: string;
  statement?: DelegateStatement;
  isSeekingDelegation: boolean;
  governor: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  votes: string;
  votesCount: number;
  delegatorsCount: number;
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
  governor?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface GetDelegateStatementInput {
  address: string;
  governorId?: string;
  organizationSlug?: string;
} 