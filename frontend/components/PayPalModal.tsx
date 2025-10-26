"use client";

import { X, AlertCircle, Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useChainId } from "wagmi";

interface PayPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethereumAddress: string;
}

export function PayPalModal({ isOpen, onClose, ethereumAddress }: PayPalModalProps) {
  const chainId = useChainId();
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [paypalWalletAddress, setPaypalWalletAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendToPayPal = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if (!paypalWalletAddress) {
      setErrorMessage("Please enter your PayPal wallet address");
      return;
    }

    // Basic validation for Ethereum address format
    if (!paypalWalletAddress.startsWith("0x") || paypalWalletAddress.length !== 42) {
      setErrorMessage("Invalid Ethereum address. Must start with '0x' and be 42 characters long");
      return;
    }

    setIsProcessing(true);
    setTxStatus("processing");
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/unshield", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ethereumAddress,
          tokenSymbol: "PYUSD", // PayPal only supports PYUSD
          amount,
          recipientAddress: paypalWalletAddress,
          chainId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transfer to PayPal failed");
      }

      setTxStatus("success");
      setTimeout(() => {
        onClose();
        setAmount("");
        setPaypalWalletAddress("");
        setTxStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("PayPal transfer error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Transfer to PayPal failed");
      setTxStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-black border border-border max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Wallet className="w-5 h-5" />
            <h2 className="text-xl font-bold">Send PYUSD to PayPal</h2>
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Info Banner */}
          <div className="border border-blue-500 bg-blue-500/10 p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-muted space-y-2">
                <p>
                  <strong className="text-white">How to get your PayPal wallet address:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open PayPal app → Crypto section</li>
                  <li>Tap "Receive" and select PYUSD</li>
                  <li>Select "Ethereum" network</li>
                  <li>Copy your wallet address and paste below</li>
                </ol>
                <p className="text-xs pt-2 border-t border-blue-500/20 mt-2">
                  Note: This sends PYUSD on-chain to your PayPal Ethereum wallet address. The tokens will appear in your PayPal crypto balance.
                </p>
                <p className="text-xs text-yellow-400 pt-2 border-t border-blue-500/20 mt-2">
                  ⚠️ This transaction unshields your PYUSD - it will be publicly visible on the Ethereum blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Amount (PYUSD)</label>
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

          {/* PayPal Wallet Address */}
          <div>
            <label className="block text-sm text-muted mb-2">PayPal Wallet Address (Ethereum)</label>
            <input
              type="text"
              value={paypalWalletAddress}
              onChange={(e) => setPaypalWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-black border border-border p-3 text-sm font-mono"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted mt-1">
              The Ethereum address from your PayPal crypto wallet (starts with 0x)
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
                ✅ PYUSD sent successfully! Check your PayPal app in a few minutes.
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
              onClick={handleSendToPayPal}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !paypalWalletAddress}
            >
              {isProcessing ? "Processing..." : "Send to PayPal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
