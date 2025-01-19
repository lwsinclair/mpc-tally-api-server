// Set NODE_ENV to 'test' to use test-specific settings
process.env.NODE_ENV = 'test';

import { TallyService } from '../tally.service.js';
import { describe, test, beforeAll, expect } from 'bun:test';

let tallyService: TallyService;

describe('TallyService - Address Votes', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required');
    }
    
    tallyService = new TallyService({ apiKey });
  });

  test('should fetch votes for an address', async () => {
    const address = '0xb49f8b8613be240213c1827e2e576044ffec7948';
    const organizationSlug = 'uniswap';

    const result = await tallyService.getAddressVotes({
      address,
      organizationSlug
    });

    expect(result).toBeDefined();
    expect(result.votes).toBeDefined();
    expect(Array.isArray(result.votes.nodes)).toBe(true);
    expect(result.votes.pageInfo).toBeDefined();
  });

  test('should handle pagination correctly', async () => {
    const address = '0xb49f8b8613be240213c1827e2e576044ffec7948';
    const organizationSlug = 'uniswap';

    // First page
    const firstPage = await tallyService.getAddressVotes({
      address,
      organizationSlug,
      limit: 2
    });

    expect(firstPage.votes).toBeDefined();
    expect(Array.isArray(firstPage.votes.nodes)).toBe(true);
    expect(firstPage.votes.nodes.length).toBeLessThanOrEqual(2);
    expect(firstPage.votes.pageInfo).toBeDefined();

    // If there's a next page, fetch it
    if (firstPage.votes.pageInfo.lastCursor) {
      const secondPage = await tallyService.getAddressVotes({
        address,
        organizationSlug,
        limit: 2,
        afterCursor: firstPage.votes.pageInfo.lastCursor
      });

      expect(secondPage.votes).toBeDefined();
      expect(Array.isArray(secondPage.votes.nodes)).toBe(true);
      expect(secondPage.votes.nodes.length).toBeLessThanOrEqual(2);
      
      // Ensure we got different results
      if (firstPage.votes.nodes.length > 0 && secondPage.votes.nodes.length > 0) {
        expect(firstPage.votes.nodes[0].id).not.toBe(secondPage.votes.nodes[0].id);
      }
    }
  });

  test('should handle invalid addresses gracefully', async () => {
    await expect(tallyService.getAddressVotes({
      address: 'invalid-address',
      organizationSlug: 'uniswap'
    })).rejects.toThrow();
  });

  test('should handle invalid organization slugs gracefully', async () => {
    await expect(tallyService.getAddressVotes({
      address: '0xb49f8b8613be240213c1827e2e576044ffec7948',
      organizationSlug: 'invalid-org'
    })).rejects.toThrow();
  });
}); 