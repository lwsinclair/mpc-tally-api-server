// Set NODE_ENV to 'test' to use test-specific settings
process.env.NODE_ENV = 'test';

import { TallyService } from '../tally.service.js';
import { describe, test, beforeAll, afterEach } from 'bun:test';
import { expect } from 'bun:test';

let tallyService: TallyService;

describe('TallyService - Address Received Delegations', () => {
  beforeAll(async () => {
    console.log('Waiting 30 seconds before starting tests...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required');
    }
    
    tallyService = new TallyService({ apiKey });
  });

  test('should fetch received delegations by address', async () => {
    console.log('Starting basic delegation fetch test...');
    const address = '0x8169522c2c57883e8ef80c498aab7820da539806';
    const governorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

    const result = await tallyService.getAddressReceivedDelegations({
      address,
      governorId,
      limit: 10
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(result.pageInfo).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
  });

  test('should handle pagination correctly', async () => {
    console.log('Starting pagination test...');
    const address = '0x8169522c2c57883e8ef80c498aab7820da539806';
    const governorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

    // First page
    const firstPage = await tallyService.getAddressReceivedDelegations({
      address,
      governorId,
      limit: 2
    });

    expect(firstPage.nodes).toBeDefined();
    expect(Array.isArray(firstPage.nodes)).toBe(true);
    expect(firstPage.nodes.length).toBeLessThanOrEqual(2);
    expect(firstPage.pageInfo).toBeDefined();
    expect(firstPage.pageInfo.hasNextPage).toBeDefined();

    // If there's a next page, fetch it
    if (firstPage.pageInfo.hasNextPage && firstPage.pageInfo.endCursor) {
      const secondPage = await tallyService.getAddressReceivedDelegations({
        address,
        governorId,
        limit: 2,
        afterCursor: firstPage.pageInfo.endCursor
      });

      expect(secondPage.nodes).toBeDefined();
      expect(Array.isArray(secondPage.nodes)).toBe(true);
      expect(secondPage.nodes.length).toBeLessThanOrEqual(2);
      
      // Ensure we got different results
      if (firstPage.nodes.length > 0 && secondPage.nodes.length > 0) {
        expect(firstPage.nodes[0].id).not.toBe(secondPage.nodes[0].id);
      }
    }
  });

  test('should handle sorting', async () => {
    console.log('Starting sorting test...');
    const address = '0x8169522c2c57883e8ef80c498aab7820da539806';
    const governorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

    // Get base results without sorting
    const baseResult = await tallyService.getAddressReceivedDelegations({
      address,
      governorId,
      limit: 5
    });

    expect(baseResult.nodes).toBeDefined();
    expect(Array.isArray(baseResult.nodes)).toBe(true);

    // Note: The API currently doesn't support sorting by votes
    // This test verifies that we can still get results without sorting
    expect(baseResult.totalCount).toBeDefined();
    expect(typeof baseResult.totalCount).toBe('number');

    // Verify that attempting to sort returns an appropriate error
    await expect(tallyService.getAddressReceivedDelegations({
      address,
      governorId,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    })).rejects.toThrow();
  });

  test('should handle invalid addresses gracefully', async () => {
    await expect(tallyService.getAddressReceivedDelegations({
      address: 'invalid-address'
    })).rejects.toThrow();
  });

  test('should handle invalid organization slugs gracefully', async () => {
    await expect(tallyService.getAddressReceivedDelegations({
      address: '0x8169522c2c57883e8ef80c498aab7820da539806',
      organizationSlug: 'invalid-org'
    })).rejects.toThrow();
  });
}); 