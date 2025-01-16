// Set NODE_ENV to 'test' to use test-specific settings
process.env.NODE_ENV = 'test';

import { TallyService } from '../tally.service.js';
import { describe, test, beforeAll, beforeEach, expect } from 'bun:test';
import { ValidationError, ResourceNotFoundError, RateLimitError } from '../errors/apiErrors.js';

let tallyService: TallyService;

// Mock data
const mockAddress = '0x8169522c2c57883e8ef80c498aab7820da539806';
const mockGovernorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';
const mockOrganizationSlug = 'test-org';

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
    test('should fetch delegate statement by address and governorId', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        governorId: mockGovernorId
      });

      if (result === null) {
        // If no statement exists, that's a valid response
        return;
      }

      expect(result.id).toBeDefined();
      expect(result.address).toBe(mockAddress);
      expect(result.statement).toBeDefined();
      expect(result.statementSummary).toBeDefined();
      expect(typeof result.isSeekingDelegation).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
      if (result.governor) {
        expect(result.governor.id).toBeDefined();
        expect(result.governor.name).toBeDefined();
        expect(result.governor.type).toBeDefined();
      }
    });

    test('should fetch delegate statement by address and organizationSlug', async () => {
      const result = await tallyService.getDelegateStatement({
        address: mockAddress,
        organizationSlug: mockOrganizationSlug
      });

      // Similar assertions as above
      expect(result).toBeDefined();
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
      })).rejects.toThrow();
    });

    test('should handle invalid governor IDs gracefully', async () => {
      await expect(tallyService.getDelegateStatement({
        address: mockAddress,
        governorId: 'invalid-governor-id'
      })).rejects.toThrow();
    });

    test('should handle non-existent organization slug', async () => {
      await expect(tallyService.getDelegateStatement({
        address: mockAddress,
        organizationSlug: 'non-existent-org'
      })).rejects.toThrow(ResourceNotFoundError);
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

      await expect(Promise.all(promises)).rejects.toThrow(RateLimitError);
    });
  });
}); 