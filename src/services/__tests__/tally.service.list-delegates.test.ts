import { describe, expect, it, beforeEach } from 'bun:test';
import { TallyService } from '../tally.service.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TallyService - listDelegates', () => {
  const apiKey = process.env.TALLY_API_KEY;
  if (!apiKey) {
    throw new Error('TALLY_API_KEY environment variable is required');
  }

  const tallyService = new TallyService({ apiKey });

  beforeEach(async () => {
    // Wait 5 seconds between tests to avoid rate limiting
    await wait(5000);
  });

  it('should fetch delegates by organization ID', async () => {
    const result = await tallyService.listDelegates({
      organizationId: '2206072050458560434', // Uniswap's organization ID
      limit: 5,
      hasVotes: true,
    });

    expect(result).toBeDefined();
    expect(result.delegates).toBeInstanceOf(Array);
    expect(result.delegates.length).toBeLessThanOrEqual(5);
    expect(result.pageInfo).toBeDefined();

    // Check delegate structure
    if (result.delegates.length > 0) {
      const delegate = result.delegates[0];
      expect(delegate).toHaveProperty('id');
      expect(delegate).toHaveProperty('account');
      expect(delegate.account).toHaveProperty('address');
      expect(delegate).toHaveProperty('votesCount');
      expect(delegate).toHaveProperty('delegatorsCount');
    }
  }, 30000);

  it('should handle non-existent organization gracefully', async () => {
    await expect(tallyService.listDelegates({
      organizationId: '999999999999999999',
      limit: 5,
    })).rejects.toThrow();
  }, 30000);
}); 