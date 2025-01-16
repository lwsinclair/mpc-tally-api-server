import { TallyService } from '../../services/tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY is required');
}

describe('TallyService - Address Metadata', () => {
  const service = new TallyService({ apiKey });
  const validAddress = '0x7e90e03654732abedf89Faf87f05BcD03ACEeFdc';

  it('should require an address', async () => {
    await expect(service.getAddressMetadata({ address: '' })).rejects.toThrow(
      'Address is required'
    );
  });

  it('should fetch metadata for a valid address', async () => {
    const result = await service.getAddressMetadata({ address: validAddress });
    expect(result).toBeDefined();
    expect(result.address.toLowerCase()).toBe(validAddress.toLowerCase());
    expect(Array.isArray(result.accounts)).toBe(true);
    if (result.accounts.length > 0) {
      const account = result.accounts[0];
      expect(account.id).toBeDefined();
      expect(account.address).toBeDefined();
    }
  });

  it('should handle invalid addresses gracefully', async () => {
    await expect(
      service.getAddressMetadata({ address: 'invalid-address' })
    ).rejects.toThrow();
  });
}); 