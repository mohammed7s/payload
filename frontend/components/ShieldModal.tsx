"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { ArrowDown, Loader2 } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { generateShieldTransaction } from "@/services/railgun";
import { ethers } from "ethers";
import { getTokenConfig, type TokenSymbol } from "@/lib/tokens";

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  railgunAddress: string;
}

export function ShieldModal({ isOpen, onClose, railgunAddress }: ShieldModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"input" | "approve" | "shield" | "success">("input");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tokenConfig = getTokenConfig(chainId, selectedToken);
  const tokenAddress = tokenConfig?.address || "";

  if (!mounted) {
    return null;
  }

  const handleShield = async () => {
    if (!address || !amount) return;

    setIsLoading(true);
    setError("");

    try {
      // Convert amount to wei (assuming 6 decimals for USDC)
      const amountWei = ethers.parseUnits(amount, 6).toString();

      // Step 1: Generate shield transaction from backend
      setStep("approve");
      console.log("📝 Generating shield transaction...");
      const shieldData = await generateShieldTransaction(address, tokenAddress, amountWei);

      console.log("Shield contract:", shieldData.transaction.to);

      // Step 2: Approve tokens
      console.log("💰 Requesting token approval...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ERC20 ABI for approve
      const erc20Abi = ["function approve(address spender, uint256 amount) returns (bool)"];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);

      const approveTx = await tokenContract.approve(shieldData.transaction.to, amountWei);
      console.log("⏳ Waiting for approval confirmation...");
      await approveTx.wait();
      console.log("✅ Tokens approved");

      // Step 3: Send shield transaction
      setStep("shield");
      console.log("📤 Sending shield transaction...");
      const tx = await signer.sendTransaction(shieldData.transaction);
      console.log("⏳ Waiting for shield confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Tokens shielded!");

      setTxHash(receipt?.hash || "");
      setStep("success");
    } catch (err: any) {
      console.error("❌ Shield failed:", err);
      setError(err.message || "Failed to shield tokens");
      setStep("input");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setAmount("");
    setError("");
    setTxHash("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Shield Tokens">
      <div className="space-y-6">
        {step === "input" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-2">Select Token</label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as TokenSymbol)}
                  className="w-full bg-black border border-border p-3 text-sm"
                >
                  <option value="USDC">USDC - USD Coin</option>
                  <option value="PYUSD">PYUSD - PayPal USD</option>
                </select>
                {tokenConfig && (
                  <p className="text-xs text-muted mt-1 font-mono">
                    {tokenConfig.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-border p-3 text-sm"
                  placeholder="1.0"
                  step="0.000001"
                  min="0"
                />
                <p className="text-xs text-muted mt-1">
                  Amount in {selectedToken} (e.g., 1.0 = 1 {selectedToken})
                </p>
              </div>

              <div className="border border-border p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <ArrowDown className="w-4 h-4 text-muted" />
                  <p className="text-xs text-muted">Shielding to</p>
                </div>
                <p className="font-mono text-xs break-all">{railgunAddress}</p>
              </div>
            </div>

            {error && (
              <div className="border border-red-500 bg-red-500/10 p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <button
              onClick={handleShield}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="w-full bg-white text-black py-3 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "Shield Tokens"}
            </button>
          </>
        )}

        {(step === "approve" || step === "shield") && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
            <div>
              <p className="font-semibold mb-2">
                {step === "approve" ? "Approving tokens..." : "Shielding tokens..."}
              </p>
              <p className="text-sm text-muted">
                {step === "approve"
                  ? "Please confirm the approval transaction in MetaMask"
                  : "Please confirm the shield transaction in MetaMask"}
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <p className="font-semibold mb-2">Tokens Shielded Successfully!</p>
              <p className="text-sm text-muted mb-4">
                Your tokens are now private on RAILGUN
              </p>
              {txHash && (
                <p className="font-mono text-xs text-muted break-all">
                  Tx: {txHash}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-white text-black py-3 font-semibold hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
