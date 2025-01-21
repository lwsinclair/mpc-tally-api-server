import { GraphQLClient } from 'graphql-request';
import { getGovernanceProposalsStats } from '../proposals/getGovernanceProposalsStats.js';
import { TallyAPIError } from '../errors/apiErrors.js';

// Using Uniswap's governor ID
const UNISWAP_GOVERNOR_ID = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';
const apiKey = process.env.TALLY_API_KEY;

const client = new GraphQLClient('https://api.tally.xyz/query', {
  headers: {
    'Api-Key': apiKey || '',
  },
});

describe('getGovernanceProposalsStats', () => {
  it('should fetch proposal stats correctly', async () => {
    const result = await getGovernanceProposalsStats(client, { 
      id: UNISWAP_GOVERNOR_ID
    });

    expect(result).toBeDefined();
    expect(result.governor).toBeDefined();
    expect(result.governor.id).toBe(UNISWAP_GOVERNOR_ID);
    expect(result.governor.chainId).toBeDefined();

    const stats = result.governor.proposalStats;
    expect(stats).toBeDefined();
    expect(typeof stats.passed).toBe('number');
    expect(typeof stats.failed).toBe('number');
  });

  it('should throw error for invalid governor ID', async () => {
    await expect(
      getGovernanceProposalsStats(client, { id: 'invalid-id' })
    ).rejects.toThrow(TallyAPIError);
  });
}); 