"use client";

import { useState } from "react";
import { Shield, Send, CheckCircle, Clock, Download, Eye } from "lucide-react";

interface Transaction {
  id: string;
  type: "shield" | "payroll";
  amount: string;
  token: string;
  recipients?: number;
  date: string;
  status: "completed" | "pending";
  poiStatus: "valid" | "pending" | "validating";
  txHash: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "payroll",
    amount: "5000.00",
    token: "USDC",
    recipients: 5,
    date: "2024-10-26",
    status: "completed",
    poiStatus: "valid",
    txHash: "0x1234567890abcdef",
  },
  {
    id: "2",
    type: "shield",
    amount: "10000.00",
    token: "USDC",
    date: "2024-10-25",
    status: "completed",
    poiStatus: "validating",
    txHash: "0xabcdef1234567890",
  },
  {
    id: "3",
    type: "payroll",
    amount: "3500.00",
    token: "PYUSD",
    recipients: 3,
    date: "2024-10-24",
    status: "completed",
    poiStatus: "valid",
    txHash: "0x9876543210fedcba",
  },
];

export default function TransactionsPage() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleDownloadPOI = (tx: Transaction) => {
    // Mock POI download
    const poiData = {
      transactionId: tx.id,
      txHash: tx.txHash,
      poiStatus: tx.poiStatus,
      proof: "0x" + "a".repeat(64),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(poiData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poi-${tx.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-muted text-sm">
          View your recent shielding and payroll transactions with POI status
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Recipients
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                POI Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mockTransactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-gray-800/30 transition-colors"
              >
                {/* Type */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {tx.type === "shield" ? (
                      <Shield className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Send className="h-4 w-4 text-purple-400" />
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tx.type === "shield"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {tx.type === "shield" ? "Shield" : "Payroll"}
                    </span>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">
                    {tx.amount} {tx.token}
                  </div>
                </td>

                {/* Recipients */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {tx.recipients ? `${tx.recipients} employees` : "—"}
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">{tx.date}</div>
                </td>

                {/* POI Status */}
                <td className="px-6 py-4">
                  {tx.poiStatus === "valid" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                  {tx.poiStatus === "validating" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs">
                      <Clock className="h-3 w-3 animate-pulse" />
                      Validating
                    </span>
                  )}
                  {tx.poiStatus === "pending" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-400 rounded text-xs">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
                      title="View POI Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View POI
                    </button>
                    <button
                      onClick={() => handleDownloadPOI(tx)}
                      disabled={tx.poiStatus !== "valid"}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download POI"
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POI Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">POI Details</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="text-white font-mono">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{selectedTx.amount} {selectedTx.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">TX Hash:</span>
                  <span className="text-white font-mono text-sm">{selectedTx.txHash}</span>
                </div>
              </div>

              {/* POI Status */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 font-semibold">POI Status:</span>
                  {selectedTx.poiStatus === "valid" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Valid
                    </span>
                  )}
                  {selectedTx.poiStatus === "validating" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded text-sm">
                      <Clock className="h-4 w-4 animate-pulse" />
                      Validating
                    </span>
                  )}
                </div>
                {selectedTx.poiStatus === "valid" && (
                  <p className="text-sm text-gray-300">
                    This transaction has been validated by the POI aggregator and can be used for private transfers.
                  </p>
                )}
                {selectedTx.poiStatus === "validating" && (
                  <p className="text-sm text-gray-300">
                    POI validation is in progress. This typically takes up to 1 hour.
                  </p>
                )}
              </div>

              {/* POI Explanation */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">
                  What is POI?
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Proof of Innocence (POI) is a zkSNARK proof that validates your shielded funds
                  are not from sanctioned addresses. It ensures compliance while maintaining privacy.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => handleDownloadPOI(selectedTx)}
                  disabled={selectedTx.poiStatus !== "valid"}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download POI
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
