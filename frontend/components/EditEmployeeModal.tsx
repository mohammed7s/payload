"use client";

import { X, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { TokenLogo } from "./TokenLogo";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  railgunAddress: string;
  salary: string;
  tokenSymbol: string;
  status: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

export function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }: EditEmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<"USDC" | "PYUSD">("USDC");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Populate form when employee changes
  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email || "");
      setSalary(employee.salary);
      setTokenSymbol(employee.tokenSymbol as "USDC" | "PYUSD");
      setStatus(employee.status as "active" | "inactive");
    }
  }, [employee]);

  const handleUpdate = async () => {
    if (!employee) return;

    if (!name.trim()) {
      setErrorMessage("Please enter employee name");
      return;
    }

    if (!salary || parseFloat(salary) <= 0) {
      setErrorMessage("Please enter a valid salary amount");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch(`http://localhost:3001/api/employees/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: email.trim() || null,
          salary,
          tokenSymbol,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update employee");
      }

      // Success - reset form and close
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Update employee error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update employee");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;

    if (!confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch(`http://localhost:3001/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete employee");
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Delete employee error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete employee");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !mounted || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-black border border-border max-w-lg w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Edit className="w-5 h-5" />
            <h2 className="text-xl font-bold">Edit Employee</h2>
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

          {/* Email Input */}
          <div>
            <label className="block text-sm text-muted mb-2">Email Address (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-black border border-border p-3 text-sm"
              disabled={isProcessing}
            />
          </div>

          {/* RAILGUN Address (Read-only) */}
          <div>
            <label className="block text-sm text-muted mb-2">RAILGUN Address</label>
            <input
              type="text"
              value={employee.railgunAddress}
              className="w-full bg-black border border-border p-3 text-sm font-mono text-muted"
              disabled
              readOnly
            />
            <p className="text-xs text-muted mt-1">
              RAILGUN address cannot be changed
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
                className={`flex-1 p-3 border transition-colors flex items-center justify-center space-x-2 ${
                  tokenSymbol === "USDC"
                    ? "bg-white text-black border-white"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                <TokenLogo symbol="USDC" size={20} />
                <span>USDC</span>
              </button>
              <button
                onClick={() => setTokenSymbol("PYUSD")}
                className={`flex-1 p-3 border transition-colors flex items-center justify-center space-x-2 ${
                  tokenSymbol === "PYUSD"
                    ? "bg-white text-black border-white"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                <TokenLogo symbol="PYUSD" size={20} />
                <span>PYUSD</span>
              </button>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm text-muted mb-2">Status</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setStatus("active")}
                className={`flex-1 p-3 border transition-colors ${
                  status === "active"
                    ? "bg-green-500 text-black border-green-500"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                Active
              </button>
              <button
                onClick={() => setStatus("inactive")}
                className={`flex-1 p-3 border transition-colors ${
                  status === "inactive"
                    ? "bg-gray-500 text-black border-gray-500"
                    : "border-border hover:border-white/50"
                }`}
                disabled={isProcessing}
              >
                Inactive
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
              onClick={handleDelete}
              className="px-6 p-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors font-semibold"
              disabled={isProcessing}
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-4 border border-border hover:bg-white/5 transition-colors font-semibold"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !name || !salary}
            >
              {isProcessing ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
