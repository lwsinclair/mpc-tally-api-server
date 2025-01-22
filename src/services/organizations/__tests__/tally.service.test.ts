import { TallyService } from '../tally.service';
import { formatDAO } from '../organizations.service';

describe('TallyService', () => {
  // Create a real service instance with actual API endpoint and key
  const service = new TallyService(
    process.env.TALLY_API_ENDPOINT || 'https://api.tally.xyz/query',
    process.env.TALLY_API_KEY || ''
  );

  describe('getDAO', () => {
    it('should fetch and format real Uniswap DAO data', async () => {
      const result = await service.getDAO('uniswap');
      
      // Test the structure and some key properties
      expect(result).toBeDefined();
      expect(result.slug).toBe('uniswap');
      expect(result.name).toBe('Uniswap');
      expect(result.chainIds).toContain('eip155:1');
      expect(result.metadata).toBeDefined();
      expect(result.stats).toBeDefined();
    });

    it('should throw an error if DAO is not found', async () => {
      await expect(service.getDAO('non-existent-dao-slug-123')).rejects.toThrow();
    });
  });
}); 