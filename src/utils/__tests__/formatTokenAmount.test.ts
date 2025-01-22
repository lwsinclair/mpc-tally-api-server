import { formatTokenAmount } from '../formatTokenAmount';

describe('formatTokenAmount', () => {
  it('should format amount with 18 decimals', () => {
    const result = formatTokenAmount('1000000000000000000', 18);
    expect(result.raw).toBe('1000000000000000000');
    expect(result.formatted).toBe('1.0');
    expect(result.readable).toBe('1.0');
  });

  it('should format amount with 6 decimals', () => {
    const result = formatTokenAmount('1000000', 6);
    expect(result.raw).toBe('1000000');
    expect(result.formatted).toBe('1.0');
    expect(result.readable).toBe('1.0');
  });

  it('should include symbol in readable format when provided', () => {
    const result = formatTokenAmount('1000000000000000000', 18, 'ETH');
    expect(result.raw).toBe('1000000000000000000');
    expect(result.formatted).toBe('1.0');
    expect(result.readable).toBe('1.0 ETH');
  });

  it('should handle zero amount', () => {
    const result = formatTokenAmount('0', 18, 'ETH');
    expect(result.raw).toBe('0');
    expect(result.formatted).toBe('0.0');
    expect(result.readable).toBe('0.0 ETH');
  });

  it('should handle large numbers', () => {
    const result = formatTokenAmount('123456789000000000000', 18, 'ETH');
    expect(result.raw).toBe('123456789000000000000');
    expect(result.formatted).toBe('123.456789');
    expect(result.readable).toBe('123.456789 ETH');
  });
}); 