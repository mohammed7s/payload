"use client";

import { useState, useEffect } from "react";
import { Copy, Download, Send, ArrowDownToLine, Check, ExternalLink } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useRailgunWallet } from "@/hooks/useRailgunWallet";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";

// Mock payment history for now
const mockPayments = [
  { id: 1, amount: "500.00", token: "USDC", date: "2025-01-15", from: "Acme Corp" },
  { id: 2, amount: "500.00", token: "USDC", date: "2025-01-01", from: "Acme Corp" },
  { id: 3, amount: "250.00", token: "PYUSD", date: "2024-12-15", from: "Freelance Project" },
];

export default function EmployeeDashboard() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { railgunWallet, isLoading: railgunLoading } = useRailgunWallet();

  // Get shielded balances
  const { balance: shieldedUSDC, isLoading: loadingUSDC } = useShieldedBalance('USDC', chainId);
  const { balance: shieldedPYUSD, isLoading: loadingPYUSD } = useShieldedBalance('PYUSD', chainId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    if (railgunWallet?.railgunAddress) {
      navigator.clipboard.writeText(railgunWallet.railgunAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Employee Dashboard</h1>
          <p className="text-muted mb-8">Connect your wallet to view your private payroll account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Private Wallet</h1>
          <p className="text-muted">Receive and manage your salary privately on RAILGUN</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* 0zk Address Card */}
            <div className="border border-border p-6 bg-zinc-900">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm text-muted mb-1">Your Private Address</h2>
                  <p className="text-xs text-muted">Share this with your employer to receive payments</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-3 py-2 border border-border hover:bg-white/5 transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {railgunLoading ? (
                <div className="font-mono text-sm text-muted">Loading wallet...</div>
              ) : railgunWallet ? (
                <div className="font-mono text-sm break-all bg-black p-4 border border-border">
                  {railgunWallet.railgunAddress}
                </div>
              ) : (
                <div className="text-muted text-sm">Creating wallet...</div>
              )}
            </div>

            {/* Balances */}
            <div className="border border-border p-6 bg-zinc-900">
              <h2 className="text-sm text-muted mb-4">Shielded Balance</h2>

              <div className="space-y-4">
                {/* USDC Balance */}
                <div className="flex items-center justify-between p-4 bg-black border border-border">
                  <div>
                    <div className="text-xs text-muted mb-1">USDC</div>
                    {loadingUSDC ? (
                      <div className="text-2xl font-bold text-muted">Loading...</div>
                    ) : (
                      <div className="text-2xl font-bold">{shieldedUSDC}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted">USD Coin</div>
                </div>

                {/* PYUSD Balance */}
                <div className="flex items-center justify-between p-4 bg-black border border-border">
                  <div>
                    <div className="text-xs text-muted mb-1">PYUSD</div>
                    {loadingPYUSD ? (
                      <div className="text-2xl font-bold text-muted">Loading...</div>
                    ) : (
                      <div className="text-2xl font-bold">{shieldedPYUSD}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted">PayPal USD</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold">
                <ArrowDownToLine className="w-4 h-4" />
                <span>Withdraw to Wallet</span>
              </button>

              <button className="flex items-center justify-center space-x-2 p-4 border border-border hover:bg-white/5 transition-colors font-semibold">
                <Send className="w-4 h-4" />
                <span>Send Private</span>
              </button>
            </div>

            {/* Recent Payments Preview */}
            <div className="border border-border p-6 bg-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Payments</h2>
                <a href="/employee/payments" className="text-xs text-muted hover:text-white flex items-center space-x-1">
                  <span>View All</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-3">
                {mockPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-black border border-border">
                    <div>
                      <div className="font-semibold text-sm">{payment.amount} {payment.token}</div>
                      <div className="text-xs text-muted">{payment.from}</div>
                    </div>
                    <div className="text-xs text-muted">{payment.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div className="border border-border p-6 bg-zinc-900">
              <h2 className="font-semibold mb-4">Quick Actions</h2>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 border border-border hover:bg-white/5 transition-colors text-sm">
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4" />
                    <span>Export Address (QR)</span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-3 border border-border hover:bg-white/5 transition-colors text-sm">
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Explorer</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="border border-green-500/30 bg-green-500/5 p-6">
              <h3 className="text-sm font-semibold mb-2 text-green-500">Private & Secure</h3>
              <p className="text-xs text-muted leading-relaxed">
                Your salary is received privately via RAILGUN. Your employer and coworkers cannot see your balance or transaction history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
