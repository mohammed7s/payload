"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

// Mock payment history - will replace with real data later
const mockPayments = [
  { id: 1, amount: "500.00", token: "USDC", date: "2025-01-15", time: "14:30", from: "Acme Corp", txHash: "0xabc123..." },
  { id: 2, amount: "500.00", token: "USDC", date: "2025-01-01", time: "14:30", from: "Acme Corp", txHash: "0xdef456..." },
  { id: 3, amount: "250.00", token: "PYUSD", date: "2024-12-15", time: "10:15", from: "Freelance Project", txHash: "0xghi789..." },
  { id: 4, amount: "500.00", token: "USDC", date: "2024-12-01", time: "14:30", from: "Acme Corp", txHash: "0xjkl012..." },
  { id: 5, amount: "500.00", token: "USDC", date: "2024-11-15", time: "14:30", from: "Acme Corp", txHash: "0xmno345..." },
  { id: 6, amount: "100.00", token: "PYUSD", date: "2024-11-10", time: "09:45", from: "Freelance Project", txHash: "0xpqr678..." },
];

export default function PaymentHistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "USDC" | "PYUSD">("all");

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

  const filteredPayments = filter === "all"
    ? mockPayments
    : mockPayments.filter(p => p.token === filter);

  const totalUSDC = mockPayments
    .filter(p => p.token === "USDC")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPYUSD = mockPayments
    .filter(p => p.token === "PYUSD")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/employee"
            className="flex items-center space-x-2 text-muted hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Payment History</h1>
              <p className="text-muted">All your received private payments</p>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 border border-border hover:bg-white/5 transition-colors text-sm">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border p-6 bg-zinc-900">
            <div className="text-xs text-muted mb-2">Total Received (USDC)</div>
            <div className="text-2xl font-bold">{totalUSDC.toFixed(2)} USDC</div>
          </div>

          <div className="border border-border p-6 bg-zinc-900">
            <div className="text-xs text-muted mb-2">Total Received (PYUSD)</div>
            <div className="text-2xl font-bold">{totalPYUSD.toFixed(2)} PYUSD</div>
          </div>

          <div className="border border-border p-6 bg-zinc-900">
            <div className="text-xs text-muted mb-2">Total Payments</div>
            <div className="text-2xl font-bold">{mockPayments.length}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 border-b border-border">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === "all"
                ? "border-white text-white"
                : "border-transparent text-muted hover:text-white"
            }`}
          >
            All ({mockPayments.length})
          </button>
          <button
            onClick={() => setFilter("USDC")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === "USDC"
                ? "border-white text-white"
                : "border-transparent text-muted hover:text-white"
            }`}
          >
            USDC ({mockPayments.filter(p => p.token === "USDC").length})
          </button>
          <button
            onClick={() => setFilter("PYUSD")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === "PYUSD"
                ? "border-white text-white"
                : "border-transparent text-muted hover:text-white"
            }`}
          >
            PYUSD ({mockPayments.filter(p => p.token === "PYUSD").length})
          </button>
        </div>

        {/* Payment List */}
        <div className="border border-border">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-border">
              <tr>
                <th className="text-left p-4 text-xs text-muted font-normal">Date</th>
                <th className="text-left p-4 text-xs text-muted font-normal">Time</th>
                <th className="text-left p-4 text-xs text-muted font-normal">From</th>
                <th className="text-right p-4 text-xs text-muted font-normal">Amount</th>
                <th className="text-left p-4 text-xs text-muted font-normal">Token</th>
                <th className="text-left p-4 text-xs text-muted font-normal">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr
                  key={payment.id}
                  className={`border-b border-border hover:bg-white/5 transition-colors ${
                    index % 2 === 0 ? "bg-black" : "bg-zinc-950"
                  }`}
                >
                  <td className="p-4 text-sm">{payment.date}</td>
                  <td className="p-4 text-sm text-muted">{payment.time}</td>
                  <td className="p-4 text-sm">{payment.from}</td>
                  <td className="p-4 text-sm font-semibold text-right">{payment.amount}</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 bg-white/10 border border-border">
                      {payment.token}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-xs font-mono text-muted hover:text-white">
                      {payment.txHash}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p>No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
