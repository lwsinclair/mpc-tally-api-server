# Rate Limiting Issues with Tally API Delegations Query

## Problem Description

The Tally API has a rate limit of 1 request per second. The API is returning 429 (Rate Limit) errors when querying for address received delegations. This occurs in these scenarios:

1. Direct Query Rate Limiting:
   - Single request for delegations data
   - If rate limit is hit, exponential backoff is triggered

2. Potential Multiple Requests:
   - When using `organizationSlug`, two API calls are made:
     1. First call to `getDAO` to get the governor ID
     2. Second call to get delegations
   - These two calls might happen within the same second

Current implementation includes:
- Exponential backoff (base delay: 10s, max delay: 2m)
- Maximum retries set to 15
- Test-specific settings with longer delays (base: 30s, max: 5m, retries: 20)

## Query Details

### Primary GraphQL Query
```graphql
query GetDelegations($input: DelegationsInput!) {
  delegatees(input: $input) {
    nodes {
      ... on Delegation {
        id
        votes
        delegator {
          id
          address
        }
      }
    }
    pageInfo {
      firstCursor
      lastCursor
    }
  }
}
```

### Secondary Query (when using organizationSlug)
A separate query to `getDAO` is made first to get the governor ID.

### Input Types
```typescript
interface DelegationsInput {
  filters: {
    address: string;      // Ethereum address (0x format)
    governorId?: string;  // Optional governor ID
  };
  page?: {
    limit?: number;       // Optional page size
  };
  sort?: {
    field: 'votes' | 'id';
    direction: 'ASC' | 'DESC';
  };
}
```

### Sample Request
```typescript
const variables = {
  input: {
    filters: {
      address: "0x8169522c2c57883e8ef80c498aab7820da539806",
      governorId: "eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3"
    },
    page: { limit: 2 },
    sort: { field: "votes", direction: "DESC" }
  }
}
```

### Response Structure
```typescript
interface DelegationResponse {
  nodes: Array<{
    id: string;
    votes: string;
    delegator: {
      id: string;
      address: string;
    };
  }>;
  pageInfo: {
    firstCursor: string;
    lastCursor: string;
  };
}
```

## Rate Limiting Implementation

Current implementation includes:
1. Exponential backoff with configurable settings:
   ```typescript
   const DEFAULT_MAX_RETRIES = 15;
   const DEFAULT_BASE_DELAY = 10000; // 10 seconds (too long for 1 req/sec limit)
   const DEFAULT_MAX_DELAY = 120000; // 2 minutes
   
   // Test environment settings
   const TEST_MAX_RETRIES = 20;
   const TEST_BASE_DELAY = 30000; // 30 seconds (too long for 1 req/sec limit)
   const TEST_MAX_DELAY = 300000; // 5 minutes
   ```

2. Retry logic with exponential backoff:
   ```typescript
   async function exponentialBackoff(retryCount: number): Promise<void> {
     const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
     await new Promise(resolve => setTimeout(resolve, delay));
   }
   ```

## Issues Identified

1. **Delay Too Long**: Our current implementation uses delays that are much longer than needed:
   - Base delay of 10s when we only need 1s
   - Test delay of 30s when we only need 1s
   - This makes tests run unnecessarily slow

2. **Multiple Requests**: When using `organizationSlug`, we make two requests that might violate the 1 req/sec limit

3. **No Rate Tracking**: We don't track when the last request was made across the service

## Recommendations

1. **Short Term**:
   - Adjust delays to match the 1 req/sec limit:
     ```typescript
     const DEFAULT_BASE_DELAY = 1000; // 1 second
     const DEFAULT_MAX_DELAY = 5000;  // 5 seconds
     ```
   - Add a delay between `getDAO` and delegation requests
   - Add request timestamp logging

2. **Medium Term**:
   - Implement a request queue that ensures 1 second between requests
   - Cache DAO/governor ID mappings to reduce API calls
   - Add rate limit header parsing

3. **Long Term**:
   - Implement a service-wide request rate limiter
   - Consider caching frequently requested data
   - Implement mock responses for testing
   - Consider batch request support if available from API 