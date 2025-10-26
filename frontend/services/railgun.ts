/**
 * RAILGUN API Service
 * Simple service to interact with our RAILGUN backend
 */

import { API_BASE_URL, buildApiUrl } from '@/lib/api';

export interface RailgunWallet {
  railgunWalletId: string;
  railgunAddress: string;
  ethereumAddress: string;
}

export interface ShieldTransaction {
  transaction: {
    to: string;
    data: string;
    value?: string;
  };
  shieldPrivateKey: string;
}

/**
 * Connect wallet - creates or retrieves RAILGUN wallet
 */
export async function connectRailgunWallet(ethereumAddress: string): Promise<RailgunWallet> {
  const response = await fetch(buildApiUrl('api/railgun/connect'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ethereumAddress }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to connect wallet');
  }

  return data.wallet;
}

/**
 * Generate shield transaction
 */
export async function generateShieldTransaction(
  ethereumAddress: string,
  tokenAddress: string,
  amount: string
): Promise<ShieldTransaction> {
  const response = await fetch(buildApiUrl('api/railgun/shield'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: ethereumAddress,
      tokenAddress,
      amount,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate shield transaction');
  }

  return {
    transaction: data.transaction,
    shieldPrivateKey: data.shieldPrivateKey,
  };
}

/**
 * Get wallet by Ethereum address
 */
export async function getRailgunWallet(ethereumAddress: string): Promise<RailgunWallet | null> {
  try {
    const response = await fetch(buildApiUrl(`api/railgun/wallet/${ethereumAddress}`));
    if (!response.ok) return null;

    const data = await response.json();
    return data.wallet;
  } catch {
    return null;
  }
}

/**
 * Get shielded balance for a token
 */
export async function getShieldedBalance(
  ethereumAddress: string,
  tokenAddress: string
): Promise<{
  balance: string;
  balanceFormatted: string;
  symbol: string;
} | null> {
  try {
  const response = await fetch(
      buildApiUrl(`api/railgun/balance/${ethereumAddress}/${tokenAddress}`)
    );
    if (!response.ok) return null;

    const data = await response.json();
    return data.balance;
  } catch {
    return null;
  }
}

/**
 * Refresh POI status for user's wallet
 */
export async function refreshPOIStatus(ethereumAddress: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`api/railgun/poi/refresh/${ethereumAddress}`),
    { method: 'POST' }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to refresh POI status');
  }
}
