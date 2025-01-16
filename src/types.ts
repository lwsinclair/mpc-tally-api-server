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