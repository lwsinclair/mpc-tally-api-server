import { formatUnits } from "ethers";

export interface FormattedTokenAmount {
  raw: string;
  formatted: string;
  readable: string;
}

/**
 * Formats a token amount with the given decimals and optional symbol
 * @param amount - The raw token amount as a string
 * @param decimals - The number of decimals for the token
 * @param symbol - Optional token symbol to append to the readable format
 * @returns An object containing raw, formatted, and readable representations
 */
export function formatTokenAmount(amount: string, decimals: number, symbol?: string): FormattedTokenAmount {
  const formatted = formatUnits(amount, decimals);
  return {
    raw: amount,
    formatted,
    readable: `${formatted}${symbol ? ` ${symbol}` : ''}`
  };
} 