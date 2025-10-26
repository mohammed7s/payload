"use client";

import { X, AlertCircle, Send } from "lucide-react";
import { useState } from "react";
import { useChainId } from "wagmi";
import { getTokenConfig, type TokenSymbol } from "@/lib/tokens";
import { buildApiUrl } from "@/lib/api";

interface SendPrivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethereumAddress: string;
}

export function SendPrivateModal({ isOpen, onClose, ethereumAddress }: SendPrivateModalProps) {
  const chainId = useChainId();
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("USDC");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const tokenConfig = getTokenConfig(chainId, selectedToken);

  const handleSendPrivate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if (!recipientAddress) {
      setErrorMessage("Please enter a recipient RAILGUN address");
      return;
    }

    // Basic validation for RAILGUN address format (0zk...)
    if (!recipientAddress.startsWith("0zk")) {
      setErrorMessage("Invalid RAILGUN address. Must start with '0zk'");
      return;
    }

    setIsProcessing(true);
    setTxStatus("processing");
    setErrorMessage("");

    try {
      const response = await fetch(buildApiUrl("api/send-private"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ethereumAddress,
          tokenSymbol: selectedToken,
          amount,
          recipientRailgunAddress: recipientAddress,
          chainId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Private transfer failed");
      }

      setTxStatus("success");
      setTimeout(() => {
        onClose();
        setAmount("");
        setRecipientAddress("");
        setTxStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Private transfer error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Private transfer failed");
      setTxStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-border max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Send className="w-5 h-5" />
            <h2 className="text-xl font-bold">Send Private</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="border border-blue-500 bg-blue-500/10 p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-muted">
                <p>
                  Send tokens privately to another RAILGUN address. This transaction is fully shielded -
                  the amount, sender, and recipient remain private.
                </p>
              </div>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm text-muted mb-2">Token</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value as TokenSymbol)}
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
            >
              <option value="USDC">USDC - USD Coin</option>
              <option value="PYUSD">PYUSD - PayPal USD</option>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
              step="0.01"
              min="0"
            />
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm text-muted mb-2">Recipient RAILGUN Address</label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0zk..."
              className="w-full bg-black border border-border p-3 text-sm font-mono"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted mt-1">
              The recipient's RAILGUN address (starts with 0zk)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="border border-red-500 bg-red-500/10 p-4">
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {txStatus === "success" && (
            <div className="border border-green-500 bg-green-500/10 p-4">
              <p className="text-sm text-green-500">
                ✅ Private transfer successful! Tokens sent privately.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 p-4 border border-border hover:bg-white/5 transition-colors font-semibold"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleSendPrivate}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !recipientAddress}
            >
              {isProcessing ? "Processing..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
