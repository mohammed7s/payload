import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getShieldedBalance } from '@/services/railgun';
import { getTokenConfig } from '@/lib/tokens';

export function useShieldedBalance(tokenSymbol: 'USDC' | 'PYUSD', chainId?: number) {
  const { address } = useAccount();
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !chainId) {
        setBalance('0.00');
        return;
      }

      const tokenConfig = getTokenConfig(chainId, tokenSymbol);
      if (!tokenConfig) {
        setError(`Token ${tokenSymbol} not configured for chain ${chainId}`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getShieldedBalance(address, tokenConfig.address);
        if (result) {
          setBalance(result.balanceFormatted);
        } else {
          setBalance('0.00');
        }
      } catch (err: any) {
        console.error('Error fetching shielded balance:', err);
        setError(err.message);
        setBalance('0.00');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [address, tokenSymbol, chainId]);

  return { balance, isLoading, error };
}
