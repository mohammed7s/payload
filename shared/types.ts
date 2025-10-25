/**
 * Shared types across frontend, backend, and scripts
 */

export interface EmployeePayment {
  employeeAddress: string; // 0zk address
  amount: string; // Amount in token base units (e.g., USDC has 6 decimals)
  tokenAddress: string;
  memo?: string;
}

export interface PayrollBatch {
  id: string;
  employerId: string;
  payments: EmployeePayment[];
  status: 'pending' | 'proof_generating' | 'ready' | 'submitted' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: number;
  submittedAt?: number;
  confirmedAt?: number;
  error?: string;
}

export interface WalletInfo {
  id: string;
  railgunAddress: string; // 0zk address
  encryptionKey: string; // Encrypted in production
}

export interface TokenBalance {
  tokenAddress: string;
  tokenSymbol: string;
  decimals: number;
  totalBalance: string; // Total shielded balance
  spendableBalance: string; // Balance past POI validation
  pendingBalance: string; // Balance pending POI
}

export interface POIStatus {
  utxoCount: number;
  validCount: number;
  invalidCount: number;
  pendingCount: number;
}

export interface TransferRequest {
  from: string; // Employer wallet ID
  to: string; // Employee 0zk address
  tokenAddress: string;
  amount: string;
  memo?: string;
}

export interface TransferResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface ShieldRequest {
  walletAddress: string; // Public Ethereum address
  tokenAddress: string;
  amount: string;
  railgunAddress: string; // 0zk address to shield to
}

export interface ShieldResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string; // e.g., "Wait 1 hour for POI validation"
}

export interface BalanceRequest {
  walletId: string;
  tokenAddress: string;
}

export interface BalanceResponse {
  balance: TokenBalance;
  poiStatus: POIStatus;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
