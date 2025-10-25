"use client";

import { Shield, Eye, Download } from "lucide-react";

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

      {/* Balance Card */}
      <div className="border border-border p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-2">
              Total Balance
            </p>
            <h2 className="text-5xl font-bold">3,000 USDC</h2>
          </div>
          <button className="p-2 hover:bg-white hover:text-black transition-colors border border-border">
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-500">All funds POI validated</span>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted mb-1">Your 0zk Address</p>
            <p className="font-mono text-sm">
              0zk1qyvrxx4tyfnjawp9eh63hmx2fzsgqu7exfly...
            </p>
          </div>
          <button className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors">
            Copy
          </button>
        </div>
      </div>

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
    </div>
  );
}
