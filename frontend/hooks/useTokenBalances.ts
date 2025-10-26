import { useAccount, useReadContracts, useBalance } from 'wagmi';
import { getAllTokens } from '@/lib/tokens';
import { formatUnits } from 'viem';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  formatted: string;
  decimals: number;
  address: string;
}

export function useTokenBalances() {
  const { address, chainId } = useAccount();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  });

  // Get all tokens for current chain
  const tokens = chainId ? getAllTokens(chainId) : [];

  // Set up contract reads for all token balances
  const { data: tokenBalances, isLoading } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      chainId,
    })),
  });

  // Format balances
  const balances: TokenBalance[] = [];

  // Add ETH balance
  if (ethBalance) {
    balances.push({
      symbol: 'ETH',
      name: 'Ethereum',
      balance: ethBalance.value.toString(),
      formatted: parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4),
      decimals: 18,
      address: 'native',
    });
  }

  // Add token balances
  if (tokenBalances && tokens.length > 0) {
    tokens.forEach((token, index) => {
      const result = tokenBalances[index];
      console.log(`Token ${token.symbol} result:`, result);

      if (result.status === 'success' && result.result !== undefined) {
        const balance = result.result as bigint;
        const formatted = parseFloat(formatUnits(balance, token.decimals)).toFixed(2);
        console.log(`Token ${token.symbol} balance: ${balance.toString()} (${formatted})`);

        balances.push({
          symbol: token.symbol,
          name: token.name,
          balance: balance.toString(),
          formatted,
          decimals: token.decimals,
          address: token.address,
        });
      } else if (result.status === 'failure') {
        console.error(`Failed to fetch ${token.symbol} balance:`, result.error);
      }
    });
  }

  return {
    balances,
    isLoading,
    hasBalance: balances.some((b) => parseFloat(b.balance) > 0),
  };
}
