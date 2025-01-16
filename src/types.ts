export interface GetAddressReceivedDelegationsInput {
  address: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  sortBy?: 'votes';
  isDescending?: boolean;
}

export interface DelegationNode {
  id: string;
  votes: string;
  delegator: {
    id: string;
    address: string;
  };
}

export interface GetAddressReceivedDelegationsOutput {
  nodes: DelegationNode[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
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