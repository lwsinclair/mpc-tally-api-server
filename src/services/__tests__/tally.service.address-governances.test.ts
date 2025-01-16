import { TallyService } from '../../services/tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY is required');
}

const validAddress = '0x7e90e03654732abedf89Faf87f05BcD03ACEeFdc';
const invalidAddress = '0xinvalid';

describe('TallyService - Address Governances', () => {
  const service = new TallyService({ apiKey });

  it('should require an address', async () => {
    await expect(service.getAddressGovernances({ address: '' })).rejects.toThrow('Address is required');
  });

  it('should fetch governances for a valid address', async () => {
    const result = await service.getAddressGovernances({ address: validAddress });
    expect(result.account).toBeDefined();
    expect(result.account.delegatedGovernors).toBeDefined();
    expect(Array.isArray(result.account.delegatedGovernors)).toBe(true);
    
    if (result.account.delegatedGovernors.length > 0) {
      const governance = result.account.delegatedGovernors[0];
      expect(governance.id).toBeDefined();
      expect(governance.name).toBeDefined();
      expect(governance.type).toBeDefined();
      expect(governance.organization).toBeDefined();
      expect(governance.stats).toBeDefined();
      expect(Array.isArray(governance.tokens)).toBe(true);
    }
  });

  it('should handle invalid addresses gracefully', async () => {
    await expect(service.getAddressGovernances({ address: invalidAddress })).rejects.toThrow('Failed to fetch address governances');
  });
}); 