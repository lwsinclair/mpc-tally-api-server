import { GraphQLClient } from 'graphql-request';
import { getGovernanceProposalsStats } from '../proposals/getGovernanceProposalsStats.js';
import { TallyAPIError } from '../errors/apiErrors.js';

// Using Uniswap's slug
const UNISWAP_SLUG = 'uniswap';
const apiKey = process.env.TALLY_API_KEY;

const client = new GraphQLClient('https://api.tally.xyz/query', {
  headers: {
    'Api-Key': apiKey || '',
  },
});

describe('getGovernanceProposalsStats', () => {
  it('should fetch proposal stats correctly', async () => {
    const result = await getGovernanceProposalsStats(client, { 
      slug: UNISWAP_SLUG
    });

    expect(result).toBeDefined();
    expect(result.governor).toBeDefined();
    expect(result.governor.chainId).toBeDefined();
    expect(result.governor.organization.slug).toBe(UNISWAP_SLUG);

    const stats = result.governor.proposalStats;
    expect(stats).toBeDefined();
    expect(typeof stats.passed).toBe('number');
    expect(typeof stats.failed).toBe('number');
  });

  it('should throw error for invalid slug', async () => {
    await expect(
      getGovernanceProposalsStats(client, { slug: 'invalid-slug' })
    ).rejects.toThrow(TallyAPIError);
  });
}); 