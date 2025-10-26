"use client";

import { X, Mail, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface InviteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerAddress: string;
}

export function InviteEmployeeModal({ isOpen, onClose, employerAddress }: InviteEmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<"USDC" | "PYUSD">("USDC");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInvite = async () => {
    if (!name.trim()) {
      setErrorMessage("Please enter employee name");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!salary || parseFloat(salary) <= 0) {
      setErrorMessage("Please enter a valid salary amount");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Mock invitation - in production this would send an email
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccessMessage(`Invitation sent to ${email}! They will receive an email with instructions to set up their RAILGUN wallet.`);

      // Reset form after 3 seconds
      setTimeout(() => {
        setName("");
        setEmail("");
        setSalary("");
        setTokenSymbol("USDC");
        setSuccessMessage("");
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Invite error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to send invitation");
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
            <Mail className="w-5 h-5" />
            <h2 className="text-xl font-bold">Invite Employee</h2>
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
                  The employee will receive an email with instructions to create a RAILGUN wallet.
                  Once they set up their wallet, they'll be added to your payroll automatically.
                </p>
              </div>
            </div>
          </div>

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

          {/* Email Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
            />
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

          {/* Success Message */}
          {successMessage && (
            <div className="border border-green-500 bg-green-500/10 p-4">
              <p className="text-sm text-green-500">✅ {successMessage}</p>
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
              onClick={handleInvite}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !name || !email || !salary || !!successMessage}
            >
              {isProcessing ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
