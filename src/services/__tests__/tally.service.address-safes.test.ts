import { TallyService } from '../../services/tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY is required');
}

const validAddress = '0x7e90e03654732abedf89Faf87f05BcD03ACEeFdc';
const invalidAddress = '0xinvalid';

describe('TallyService - Address Safes', () => {
  const service = new TallyService({ apiKey });

  it('should require an address', async () => {
    await expect(service.getAddressSafes({ address: '' })).rejects.toThrow('Address is required');
  });

  it('should fetch safes for a valid address', async () => {
    const result = await service.getAddressSafes({ address: validAddress });
    expect(result.account).toBeDefined();
    expect(result.account.safes === null || Array.isArray(result.account.safes)).toBe(true);
  });

  it('should handle invalid addresses gracefully', async () => {
    await expect(service.getAddressSafes({ address: invalidAddress })).rejects.toThrow('Failed to fetch address safes');
  });
}); 