"use client";

import { X, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerAddress: string;
  onSuccess?: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, employerAddress, onSuccess }: AddEmployeeModalProps) {
  const [name, setName] = useState("");
  const [railgunAddress, setRailgunAddress] = useState("");
  const [salary, setSalary] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<"USDC" | "PYUSD">("USDC");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddEmployee = async () => {
    if (!name.trim()) {
      setErrorMessage("Please enter employee name");
      return;
    }

    if (!railgunAddress.trim()) {
      setErrorMessage("Please enter RAILGUN address");
      return;
    }

    if (!railgunAddress.startsWith("0zk")) {
      setErrorMessage("Invalid RAILGUN address. Must start with '0zk'");
      return;
    }

    if (!salary || parseFloat(salary) <= 0) {
      setErrorMessage("Please enter a valid salary amount");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch(buildApiUrl("api/employees"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employerAddress,
          name,
          railgunAddress,
          salary,
          tokenSymbol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add employee");
      }

      // Success - reset form and close
      setName("");
      setRailgunAddress("");
      setSalary("");
      setTokenSymbol("USDC");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Add employee error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to add employee");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-border max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-xl font-bold">Add Employee</h2>
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
          {/* Name Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Employee Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
            />
          </div>

          {/* RAILGUN Address */}
          <div>
            <label className="block text-sm text-muted mb-2">RAILGUN Address</label>
            <input
              type="text"
              value={railgunAddress}
              onChange={(e) => setRailgunAddress(e.target.value)}
              placeholder="0zk..."
              className="w-full bg-black border border-border p-3 text-sm font-mono"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted mt-1">
              The employee's RAILGUN address (starts with 0zk)
            </p>
          </div>

          {/* Salary Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Monthly Salary</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="1000"
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
              step="0.01"
              min="0"
            />
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm text-muted mb-2">Payment Token</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setTokenSymbol("USDC")}
                className={`flex-1 p-3 border transition-colors ${
                  tokenSymbol === "USDC"
                    ? "bg-white text-black border-white"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                USDC
              </button>
              <button
                onClick={() => setTokenSymbol("PYUSD")}
                className={`flex-1 p-3 border transition-colors ${
                  tokenSymbol === "PYUSD"
                    ? "bg-white text-black border-white"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                PYUSD
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="border border-red-500 bg-red-500/10 p-4">
              <p className="text-sm text-red-500">{errorMessage}</p>
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
              onClick={handleAddEmployee}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !name || !railgunAddress || !salary}
            >
              {isProcessing ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
