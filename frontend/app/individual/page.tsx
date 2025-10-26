"use client";

import { Shield, Eye, Download, ArrowDown, Send, Landmark, Wallet } from "lucide-react";
import { useRailgunWallet } from "@/hooks/useRailgunWallet";
import { useAccount, useChainId } from "wagmi";
import { ShieldModal } from "@/components/ShieldModal";
import { UnshieldModal } from "@/components/UnshieldModal";
import { SendPrivateModal } from "@/components/SendPrivateModal";
import { PayPalModal } from "@/components/PayPalModal";
import { BankModal } from "@/components/BankModal";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { useState } from "react";

// Mock data
const mockPayments = [
  {
    id: 1,
    date: "2024-10-15",
    amount: "1,000 USDC",
    status: "Confirmed",
    txHash: "0x1234...5678",
  },
  {
    id: 2,
    date: "2024-10-01",
    amount: "1,000 USDC",
    status: "Confirmed",
    txHash: "0xabcd...ef00",
  },
  {
    id: 3,
    date: "2024-09-15",
    amount: "1,000 USDC",
    status: "Confirmed",
    txHash: "0x9876...4321",
  },
];

export default function IndividualPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { railgunWallet, isLoading, error } = useRailgunWallet();
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [showUnshieldModal, setShowUnshieldModal] = useState(false);
  const [showSendPrivateModal, setShowSendPrivateModal] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Get shielded balances
  const { balance: shieldedUSDC, isLoading: loadingUSDC } = useShieldedBalance('USDC', chainId);
  const { balance: shieldedPYUSD, isLoading: loadingPYUSD } = useShieldedBalance('PYUSD', chainId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Hero Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Your Private Payroll</h1>
        </div>
        <p className="text-muted">
          Receive payments privately. Your employer can't see your balance.
          You maintain complete financial privacy.
        </p>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="border border-yellow-500 bg-yellow-500/10 p-6">
          <p className="text-sm text-yellow-500">
            Please connect your wallet to view your RAILGUN balance and receive payments.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="border border-border p-6">
          <p className="text-sm text-muted">Loading your RAILGUN wallet...</p>
        </div>
      )}

      {error && (
        <div className="border border-red-500 bg-red-500/10 p-6">
          <p className="text-sm text-red-500">Error: {error}</p>
        </div>
      )}

      {/* Balance Card */}
      {railgunWallet && (
        <div className="border border-border p-8 space-y-6">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-4">
              Shielded Balance
            </p>

            {/* Balances in two columns */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              {/* USDC Balance */}
              <div>
                <p className="text-xs text-muted mb-1">USDC</p>
                {loadingUSDC ? (
                  <h2 className="text-3xl font-bold text-muted">Loading...</h2>
                ) : (
                  <h2 className="text-3xl font-bold">{shieldedUSDC}</h2>
                )}
              </div>

              {/* PYUSD Balance */}
              <div>
                <p className="text-xs text-muted mb-1">PYUSD</p>
                {loadingPYUSD ? (
                  <h2 className="text-3xl font-bold text-muted">Loading...</h2>
                ) : (
                  <h2 className="text-3xl font-bold">{shieldedPYUSD}</h2>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setShowUnshieldModal(true)}
                className="flex items-center justify-center space-x-2 p-3 bg-white text-black hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                <ArrowDown className="w-4 h-4" />
                <span>Unshield</span>
              </button>

              <button
                onClick={() => setShowSendPrivateModal(true)}
                className="flex items-center justify-center space-x-2 p-3 border border-border hover:bg-white/5 transition-colors font-semibold text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send Private</span>
              </button>

              <button
                onClick={() => setShowPayPalModal(true)}
                className="flex items-center justify-center space-x-2 p-3 border border-border hover:bg-white/5 transition-colors font-semibold text-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>To PayPal</span>
              </button>

              <button
                onClick={() => setShowBankModal(true)}
                className="flex items-center justify-center space-x-2 p-3 border border-border hover:bg-white/5 transition-colors font-semibold text-sm"
              >
                <Landmark className="w-4 h-4" />
                <span>To Bank</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-500">RAILGUN wallet active</span>
          </div>

          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-muted mb-1">Your 0zk Address</p>
              <p className="font-mono text-sm break-all">
                {railgunWallet.railgunAddress}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(railgunWallet.railgunAddress)}
              className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors ml-4"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Shield Tokens Section */}
      {railgunWallet && address && (
        <div className="border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-muted" />
              <div>
                <p className="text-sm font-semibold">Shield Your Tokens</p>
                <p className="text-xs text-muted">
                  Move tokens from Ethereum ({address.slice(0, 6)}...{address.slice(-4)}) to RAILGUN for privacy
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowShieldModal(true)}
              className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors font-semibold text-sm"
            >
              Shield →
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment History</h2>
          <button className="text-xs flex items-center space-x-2 px-4 py-2 border border-border hover:bg-white hover:text-black transition-colors">
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">
                  Date
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">
                  Amount
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-white hover:text-black border-b border-border last:border-b-0 transition-colors"
                >
                  <td className="p-4">{payment.date}</td>
                  <td className="p-4 font-bold">{payment.amount}</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 bg-green-500 text-black">
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted">
                    {payment.txHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="border border-border p-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            This Month
          </p>
          <p className="text-3xl font-bold">1,000 USDC</p>
        </div>
        <div className="border border-border p-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            Total Received
          </p>
          <p className="text-3xl font-bold">3,000 USDC</p>
        </div>
        <div className="border border-border p-6">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            Payments
          </p>
          <p className="text-3xl font-bold">3</p>
        </div>
      </div>

      {/* Shield Modal */}
      {railgunWallet && (
        <ShieldModal
          isOpen={showShieldModal}
          onClose={() => setShowShieldModal(false)}
          railgunAddress={railgunWallet.railgunAddress}
        />
      )}

      {/* Unshield Modal */}
      {railgunWallet && address && (
        <UnshieldModal
          isOpen={showUnshieldModal}
          onClose={() => setShowUnshieldModal(false)}
          ethereumAddress={address}
        />
      )}

      {/* Send Private Modal */}
      {railgunWallet && address && (
        <SendPrivateModal
          isOpen={showSendPrivateModal}
          onClose={() => setShowSendPrivateModal(false)}
          ethereumAddress={address}
        />
      )}

      {/* PayPal Modal */}
      {railgunWallet && address && (
        <PayPalModal
          isOpen={showPayPalModal}
          onClose={() => setShowPayPalModal(false)}
          ethereumAddress={address}
        />
      )}

      {/* Bank Modal */}
      {railgunWallet && address && (
        <BankModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          ethereumAddress={address}
        />
      )}
    </div>
  );
}
