import { TallyService } from '../tally.service.js';
import { beforeEach, describe, expect, it, test } from 'bun:test';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - DAO', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
  });

  describe('getDAO', () => {
    it('should fetch complete DAO details', async () => {
      const dao = await tallyService.getDAO('uniswap');
      
      // Basic DAO properties
      expect(dao).toBeDefined();
      expect(dao.id).toBeDefined();
      expect(dao.name).toBe('Uniswap');
      expect(dao.slug).toBe('uniswap');
      
      // Chain IDs and Token IDs
      expect(dao.chainIds).toBeDefined();
      expect(Array.isArray(dao.chainIds)).toBe(true);
      expect(dao.chainIds).toContain('eip155:1'); // Ethereum mainnet

      // Token IDs - specifically check for UNI token
      expect(dao.tokenIds).toBeDefined();
      expect(Array.isArray(dao.tokenIds)).toBe(true);
      expect(dao.tokenIds.length).toBeGreaterThan(0);
      expect(dao.tokenIds).toContain('eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'); // UNI token
      
      // Stats and counters
      expect(typeof dao.proposalsCount).toBe('number');
      expect(dao.proposalsCount).toBeGreaterThan(0);
      expect(typeof dao.delegatesCount).toBe('number');
      expect(dao.delegatesCount).toBeGreaterThan(0);
      expect(typeof dao.tokenOwnersCount).toBe('number');
      expect(dao.tokenOwnersCount).toBeGreaterThan(0);
      
      // Metadata
      expect(dao.metadata).toBeDefined();
      if (dao.metadata) {
        expect(dao.metadata.description).toBeDefined();
        expect(dao.metadata.icon).toBeDefined();
        
        // Check if socials exist in metadata
        expect(dao.metadata.socials).toBeDefined();
        if (dao.metadata.socials) {
          expect(dao.metadata.socials.website).toBeDefined();
          expect(dao.metadata.socials.discord).toBeDefined();
          expect(dao.metadata.socials.twitter).toBeDefined();
        }
      }
    }, 30000);

    it('should handle non-existent DAO gracefully', async () => {
      const nonExistentSlug = 'non-existent-dao-123';
      let error: Error | undefined;
      
      try {
        await tallyService.getDAO(nonExistentSlug);
      } catch (e) {
        error = e as Error;
      }
      
      expect(error).toBeDefined();
      expect(String(error)).toContain('Failed to fetch DAO');
    });
  });

  describe('getDAOTokens', () => {
    it('should fetch token details for a given token ID', async () => {
      const tokenId = 'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'; // UNI token
      const tokens = await tallyService.getDAOTokens([tokenId]);
      
      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBe(1);
      
      const token = tokens[0];
      expect(token.id).toBe(tokenId);
      expect(token.name).toBe('Uniswap');
      expect(token.symbol).toBe('UNI');
      expect(token.decimals).toBe(18);
      expect(typeof token.supply).toBe('string');
      expect(typeof token.isIndexing).toBe('boolean');
      expect(typeof token.isBehind).toBe('boolean');
    }, 30000);

    it('should handle empty array of token IDs', async () => {
      const tokens = await tallyService.getDAOTokens([]);
      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBe(0);
    });
  });
}); 