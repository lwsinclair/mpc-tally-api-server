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

  test.skip('should handle pagination correctly', async () => {
    // Test pagination when basic test passes
  });

  test.skip('should handle sorting', async () => {
    // Test sorting when basic test passes
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