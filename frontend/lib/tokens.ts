import { sepolia, mainnet } from 'wagmi/chains';

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address: `0x${string}`;
  icon?: string;
}

export const TOKENS = {
  [sepolia.id]: {
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
    },
    PYUSD: {
      symbol: 'PYUSD',
      name: 'PayPal USD',
      decimals: 6,
      address: '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9' as `0x${string}`,
    },
  },
  [mainnet.id]: {
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
    },
    PYUSD: {
      symbol: 'PYUSD',
      name: 'PayPal USD',
      decimals: 6,
      address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' as `0x${string}`,
    },
  },
} as const;

export type TokenSymbol = 'USDC' | 'PYUSD';

export function getTokenConfig(chainId: number, symbol: TokenSymbol): TokenConfig | undefined {
  return TOKENS[chainId as keyof typeof TOKENS]?.[symbol];
}

export function getAllTokens(chainId: number): TokenConfig[] {
  const chainTokens = TOKENS[chainId as keyof typeof TOKENS];
  if (!chainTokens) return [];
  return Object.values(chainTokens);
}
