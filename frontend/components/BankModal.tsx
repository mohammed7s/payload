"use client";

import { X, AlertCircle, Landmark, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useChainId } from "wagmi";

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethereumAddress: string;
}

type OfframpProvider = "circle" | "bridge";

export function BankModal({ isOpen, onClose, ethereumAddress }: BankModalProps) {
  const chainId = useChainId();
  const [selectedProvider, setSelectedProvider] = useState<OfframpProvider | null>(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProviderSelect = (provider: OfframpProvider) => {
    setSelectedProvider(provider);
  };

  const handleContinue = () => {
    if (selectedProvider === "circle") {
      // Open Circle's off-ramp in new window
      window.open("https://www.circle.com/en/usdc", "_blank");
    } else if (selectedProvider === "bridge") {
      // Open Bridge's off-ramp in new window
      window.open("https://www.bridge.xyz/", "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-black border border-border max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Landmark className="w-5 h-5" />
            <h2 className="text-xl font-bold">Send USDC to Bank Account</h2>
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
          {/* Provider Selection */}
          <div>
            <label className="block text-sm text-muted mb-3">Select Off-ramp Provider</label>
            <div className="space-y-3">
              {/* Circle Option */}
              <button
                onClick={() => handleProviderSelect("circle")}
                className={`w-full p-4 border transition-colors text-left ${
                  selectedProvider === "circle"
                    ? "border-white bg-white/5"
                    : "border-border hover:border-white/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Circle Logo Placeholder */}
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Circle</h3>
                      <p className="text-xs text-muted">
                        Direct USDC issuer with global bank transfers. Supports most countries.
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30">
                          Recommended
                        </span>
                        <span className="text-xs text-muted">Fast processing</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted flex-shrink-0" />
                </div>
              </button>

              {/* Bridge Option */}
              <button
                onClick={() => handleProviderSelect("bridge")}
                className={`w-full p-4 border transition-colors text-left ${
                  selectedProvider === "bridge"
                    ? "border-white bg-white/5"
                    : "border-border hover:border-white/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Bridge Logo Placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">BR</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Bridge</h3>
                      <p className="text-xs text-muted">
                        Stablecoin infrastructure for businesses. Developer-friendly API.
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted">Enterprise solution</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted flex-shrink-0" />
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 p-4 border border-border hover:bg-white/5 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedProvider}
            >
              Continue to {selectedProvider === "circle" ? "Circle" : selectedProvider === "bridge" ? "Bridge" : "Provider"} →
            </button>
          </div>

          {selectedProvider && (
            <p className="text-xs text-muted text-center border-t border-border pt-4">
              You'll be redirected to {selectedProvider === "circle" ? "Circle" : "Bridge"} to complete your withdrawal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
