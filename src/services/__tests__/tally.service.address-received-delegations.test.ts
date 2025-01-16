import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - Address Received Delegations', () => {
  let service: TallyService;

  beforeAll(() => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required for tests');
    }
    service = new TallyService({ apiKey });
  });

  const testTimeout = 20000; // 20 seconds
  const testAddress = '0x8169522c2c57883e8ef80c498aab7820da539806'; // Uniswap delegate with known delegations
  const testGovernorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3'; // Uniswap governor

  it('should fetch received delegations by address', async () => {
    const result = await service.getAddressReceivedDelegations({
      address: testAddress,
      governorId: testGovernorId // Use governor ID directly to avoid rate limiting
    });
    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
  }, testTimeout);

  it('should handle pagination correctly', async () => {
    const result = await service.getAddressReceivedDelegations({
      address: testAddress,
      governorId: testGovernorId,
      limit: 2
    });
    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
    expect(result.nodes.length).toBeLessThanOrEqual(2);
  }, testTimeout);

  it('should handle sorting', async () => {
    const result = await service.getAddressReceivedDelegations({
      address: testAddress,
      governorId: testGovernorId,
      sortBy: 'votes',
      isDescending: true
    });
    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
  }, testTimeout);

  it('should handle invalid addresses gracefully', async () => {
    await expect(service.getAddressReceivedDelegations({
      address: 'invalid-address',
      governorId: testGovernorId
    })).rejects.toThrow();
  }, testTimeout);

  it('should handle invalid organization slugs gracefully', async () => {
    await expect(service.getAddressReceivedDelegations({
      address: testAddress,
      organizationSlug: 'invalid-org'
    })).rejects.toThrow();
  }, testTimeout);
}); 