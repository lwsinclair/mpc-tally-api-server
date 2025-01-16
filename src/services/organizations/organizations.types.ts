// Basic Types
export type OrganizationsSortBy = "id" | "name" | "explore" | "popular";

// Input Types
export interface OrganizationsSortInput {
  isDescending: boolean;
  sortBy: OrganizationsSortBy;
}

export interface PageInput {
  afterCursor?: string;
  beforeCursor?: string;
  limit?: number;
}

export interface OrganizationsFiltersInput {
  hasLogo?: boolean;
  chainId?: string;
  isMember?: boolean;
  address?: string;
  slug?: string;
  name?: string;
}

export interface OrganizationsInput {
  filters?: OrganizationsFiltersInput;
  page?: PageInput;
  sort?: OrganizationsSortInput;
  search?: string;
}

export interface ListDAOsParams {
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: OrganizationsSortBy;
}

// Response Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  chainIds: string[];
  tokenIds: string[];
  governorIds: string[];
  metadata: {
    description: string;
    icon: string;
    socials: {
      website: string;
      discord: string;
      twitter: string;
    }
  };
  stats: {
    proposalsCount: number;
    tokenOwnersCount: number;
    delegatesCount: number;
    delegatesVotesCount: string;
    hasActiveProposals: boolean;
  }
}

export interface PageInfo {
  firstCursor: string | null;
  lastCursor: string | null;
}

export interface OrganizationsResponse {
  organizations: {
    nodes: Organization[];
    pageInfo: PageInfo;
  };
}

export interface GetDAOResponse {
  organizations: {
    nodes: Organization[];
  };
}

export interface ListDAOsResponse {
  data: OrganizationsResponse;
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

export interface GetDAOBySlugResponse {
  data: GetDAOResponse;
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