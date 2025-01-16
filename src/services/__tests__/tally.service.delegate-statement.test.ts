import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - Delegate Statement', () => {
  let service: TallyService;

  beforeAll(() => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required for tests');
    }
    service = new TallyService({ apiKey });
  });

  const testTimeout = 20000; // 20 seconds
  const testAddress = '0x8169522c2c57883e8ef80c498aab7820da539806'; // Uniswap delegate with known statements
  const testGovernorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3'; // Uniswap governor

  it('should require an address', async () => {
    await expect(service.getDelegateStatement({
      // @ts-expect-error testing invalid input
      address: undefined,
      governorId: testGovernorId
    })).rejects.toThrow('Address is required');
  });

  it('should require either governorId or organizationSlug', async () => {
    await expect(service.getDelegateStatement({
      address: testAddress
    })).rejects.toThrow('Either governorId or organizationSlug is required');
  });

  it('should fetch delegate statement using organization slug', async () => {
    const result = await service.getDelegateStatement({
      address: testAddress,
      organizationSlug: 'uniswap'
    });
    expect(result).toBeDefined();
  }, testTimeout);

  it('should fetch delegate statement using governor ID', async () => {
    const result = await service.getDelegateStatement({
      address: testAddress,
      governorId: testGovernorId
    });
    expect(result).toBeDefined();
  }, testTimeout);

  it('should handle invalid addresses gracefully', async () => {
    await expect(service.getDelegateStatement({
      address: 'invalid-address',
      governorId: testGovernorId
    })).rejects.toThrow();
  }, testTimeout);

  it('should handle invalid organization slugs gracefully', async () => {
    await expect(service.getDelegateStatement({
      address: testAddress,
      organizationSlug: 'invalid-org'
    })).rejects.toThrow();
  }, testTimeout);

  it('should handle invalid governor IDs gracefully', async () => {
    await expect(service.getDelegateStatement({
      address: testAddress,
      governorId: 'invalid-id'
    })).rejects.toThrow();
  }, testTimeout);
}); 