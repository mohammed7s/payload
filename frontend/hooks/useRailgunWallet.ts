"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { connectRailgunWallet, RailgunWallet } from '@/services/railgun';

export function useRailgunWallet() {
  const { address, isConnected } = useAccount();
  const [railgunWallet, setRailgunWallet] = useState<RailgunWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRailgunWallet() {
      if (!isConnected || !address) {
        setRailgunWallet(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('🔌 Connecting to RAILGUN backend for address:', address);
        const wallet = await connectRailgunWallet(address);
        console.log('✅ RAILGUN wallet connected');
        setRailgunWallet(wallet);
      } catch (err: any) {
        console.error('❌ Failed to connect RAILGUN wallet:', err);
        setError(err.message || 'Failed to connect to RAILGUN');
      } finally {
        setIsLoading(false);
      }
    }

    loadRailgunWallet();
  }, [address, isConnected]);

  return {
    railgunWallet,
    isLoading,
    error,
    isConnected: !!railgunWallet,
  };
}
