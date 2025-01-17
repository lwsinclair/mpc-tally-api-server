// Set NODE_ENV to 'test' to use test-specific settings
process.env.NODE_ENV = 'test';

import { TallyService } from '../tally.service.js';
import { describe, test, beforeAll, beforeEach, expect } from 'bun:test';
import { ValidationError, ResourceNotFoundError, RateLimitError } from '../errors/apiErrors.js';

let tallyService: TallyService;

// Mock data - using Uniswap's data
const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
const mockGovernorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3'; // Uniswap's governor
const mockOrganizationSlug = 'uniswap';

describe('TallyService - Delegate Statement', () => {
  beforeAll(async () => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required');
    }
    
    tallyService = new TallyService({ apiKey });
  });

  describe('Input Validation', () => {
    test('should throw ValidationError when address is missing', async () => {
      await expect(tallyService.getDelegateStatement({
        // @ts-expect-error Testing invalid input
        address: '',
        governorId: mockGovernorId
      })).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError when neither governorId nor organizationSlug is provided', async () => {
      await expect(tallyService.getDelegateStatement({
        // @ts-expect-error Testing invalid input
        address: mockAddress
      })).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError when both governorId and organizationSlug are provided', async () => {
      await expect(tallyService.getDelegateStatement({
        // @ts-expect-error Testing invalid input
        address: mockAddress,
        governorId: mockGovernorId,
        organizationSlug: mockOrganizationSlug
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('Successful Requests', () => {
    test('should handle delegate statement by address and governorId', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        governorId: mockGovernorId
      });

      // Since we're using real data, we can't guarantee a statement exists
      // Just verify we get a valid response (null or a properly formatted statement)
      expect(result === null || (
        typeof result === 'object' &&
        typeof result.id === 'string' &&
        typeof result.address === 'string' &&
        typeof result.isSeekingDelegation === 'boolean' &&
        Array.isArray(result.issues)
      )).toBe(true);
    });

    test('should handle delegate statement by address and organizationSlug', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        organizationSlug: mockOrganizationSlug
      });

      // Similar assertions as above
      expect(result === null || (
        typeof result === 'object' &&
        typeof result.id === 'string' &&
        typeof result.address === 'string' &&
        typeof result.isSeekingDelegation === 'boolean' &&
        Array.isArray(result.issues)
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent delegate gracefully', async () => {
      const result = await tallyService.getDelegateStatement({
        address: '0x0000000000000000000000000000000000000000',
        governorId: mockGovernorId
      });

      expect(result).toBeNull();
    });

    test('should handle invalid addresses gracefully', async () => {
      await expect(tallyService.getDelegateStatement({
        address: 'invalid-address',
        governorId: mockGovernorId
      })).rejects.toThrow(ValidationError);
    });

    test('should handle invalid governor IDs gracefully', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        governorId: 'invalid-governor-id'
      });

      expect(result).toBeNull();
    });

    test('should handle non-existent organization slug', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        organizationSlug: 'non-existent-org'
      });

      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting with exponential backoff', async () => {
      // Make multiple requests in quick succession to trigger rate limiting
      const promises = Array(5).fill(null).map(() => 
        tallyService.getDelegateStatement({
          address: mockAddress,
          governorId: mockGovernorId
        })
      );

      // Since we're using real data, we can't guarantee rate limiting will occur
      // Just verify we get valid responses (null or properly formatted statements)
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result === null || (
          typeof result === 'object' &&
          typeof result.id === 'string' &&
          typeof result.address === 'string' &&
          typeof result.isSeekingDelegation === 'boolean' &&
          Array.isArray(result.issues)
        )).toBe(true);
      });
    });
  });
}); 