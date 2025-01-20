import { TallyService } from '../../services/tally.service.js';
import { Organization, TokenWithSupply, OrganizationWithTokens } from '../organizations/organizations.types.js';
import { beforeEach, describe, expect, it, test } from 'bun:test';
import dotenv from 'dotenv';

dotenv.config();

type DAOResponse = { organization: OrganizationWithTokens };

describe('TallyService - DAO', () => {
  const tallyService = new TallyService({ apiKey: process.env.TALLY_API_KEY || 'test-api-key' });

  describe('getDAO', () => {
    it('should fetch complete DAO details', async () => {
      const result = await tallyService.getDAO('uniswap') as unknown as DAOResponse;

      // Basic DAO properties
      expect(result).toBeDefined();
      expect(result.organization).toBeDefined();
      expect(result.organization.id).toBeDefined();
      expect(result.organization.name).toBeDefined();
      expect(result.organization.slug).toBe('uniswap');
      expect(result.organization.chainIds).toBeDefined();
      expect(result.organization.chainIds).toBeInstanceOf(Array);
      expect(result.organization.chainIds.length).toBeGreaterThan(0);

      // Metadata
      expect(result.organization.metadata).toBeDefined();
      expect(result.organization.metadata.description).toBeDefined();
      expect(result.organization.metadata.socials).toBeDefined();
      expect(result.organization.metadata.socials.website).toBeDefined();
      expect(result.organization.metadata.socials.discord).toBeDefined();
      expect(result.organization.metadata.socials.twitter).toBeDefined();

      // Stats
      expect(result.organization.proposalsCount).toBeDefined();
      expect(result.organization.delegatesCount).toBeDefined();
      expect(result.organization.tokenOwnersCount).toBeDefined();

      // Token IDs
      expect(result.organization.tokenIds).toBeDefined();
      expect(result.organization.tokenIds).toBeInstanceOf(Array);
      expect(result.organization.tokenIds.length).toBeGreaterThan(0);
      expect(result.organization.tokenIds[0]).toBe('eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984');

      // Tokens
      expect(result.organization.tokens).toBeDefined();
      expect(result.organization.tokens).toBeInstanceOf(Array);
      expect(result.organization.tokens!.length).toBeGreaterThan(0);
      const token = result.organization.tokens![0];
      expect(token.id).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.symbol).toBeDefined();
      expect(token.decimals).toBeDefined();
      expect(token.formattedSupply).toBeDefined();
    });

    it('should handle non-existent DAO gracefully', async () => {
      await expect(tallyService.getDAO('non-existent-dao')).rejects.toThrow('Organization not found');
    });
  });

  describe('getDAOTokens', () => {
    it('should fetch token details for a given token ID', async () => {
      const tokenIds = ['eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'];
      const tokens = await tallyService.getDAOTokens(tokenIds);

      expect(tokens).toBeDefined();
      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBe(1);

      const token = tokens[0] as TokenWithSupply;
      expect(token.id).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.symbol).toBeDefined();
      expect(token.decimals).toBeDefined();
      expect(token.formattedSupply).toBeDefined();
    });

    it('should handle empty array of token IDs', async () => {
      const tokens = await tallyService.getDAOTokens([]);
      expect(tokens).toEqual([]);
    });
  });
}); 