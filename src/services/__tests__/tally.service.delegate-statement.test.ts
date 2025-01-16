// Set NODE_ENV to 'test' to use test-specific settings
process.env.NODE_ENV = 'test';

import { TallyService } from '../tally.service.js';
import { describe, test, beforeAll } from 'bun:test';
import { expect } from 'bun:test';

let tallyService: TallyService;

describe('TallyService - Delegate Statement', () => {
  beforeAll(() => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required');
    }
    
    tallyService = new TallyService({ apiKey });
  });

  test('should fetch delegate statement by address and governorId', async () => {
    const address = '0x8169522c2c57883e8ef80c498aab7820da539806';
    const governorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

    const result = await tallyService.getDelegateStatement({
      address,
      governorId
    });

    if (result === null) {
      // If no statement exists, that's a valid response
      return;
    }

    expect(result.id).toBeDefined();
    expect(result.address).toBe(address);
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

  test('should handle non-existent delegate gracefully', async () => {
    const result = await tallyService.getDelegateStatement({
      address: '0x1234567890123456789012345678901234567890',
      governorId: 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3'
    });

    expect(result).toBeNull();
  });

  test('should handle invalid addresses gracefully', async () => {
    await expect(tallyService.getDelegateStatement({
      address: 'invalid-address',
      governorId: 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3'
    })).rejects.toThrow();
  });

  test('should handle invalid governor IDs gracefully', async () => {
    await expect(tallyService.getDelegateStatement({
      address: '0x8169522c2c57883e8ef80c498aab7820da539806',
      governorId: 'invalid-governor'
    })).rejects.toThrow();
  });
}); 