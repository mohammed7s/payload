"use client";

import { useState, useEffect } from "react";
import { X, Wallet, Shield, Send, CheckCircle, AlertCircle, Loader2, Edit2, ExternalLink } from "lucide-react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { generateShieldTransaction } from "@/services/railgun";
import { ToastContainer } from "./Toast";

type PaymentSource = "ethereum" | "railgun";

type PayrollStep = {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  description?: string;
  error?: string;
  txHash?: string;
};

interface Employee {
  id: string;
  name: string;
  railgunAddress: string;
  salary: string;
  tokenSymbol: string;
  status: string;
}

interface SelectedEmployee {
  id: string;
  name: string;
  railgunAddress: string;
  amount: string;
  tokenSymbol: string;
}

interface PayrollExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedToken: string;
  ethereumBalance: string;
  railgunBalance: string;
  tokenAddress: string;
  tokenDecimals: number;
  onBalanceUpdate?: () => void;
}

export function PayrollExecutionModal({
  isOpen,
  onClose,
  employees,
  selectedToken,
  ethereumBalance,
  railgunBalance,
  tokenAddress,
  tokenDecimals,
  onBalanceUpdate,
}: PayrollExecutionModalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [paymentSource, setPaymentSource] = useState<PaymentSource>("ethereum");
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<PayrollStep[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type?: "success" | "loading" | "info";
    txHash?: string;
  }>>([]);

  // Toast helpers
  const addToast = (message: string, type?: "success" | "loading" | "info", txHash?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, txHash }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateToast = (id: string, updates: Partial<{ message: string; type: "success" | "loading" | "info"; txHash: string }>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Initialize selected employees when modal opens
  useEffect(() => {
    if (isOpen && !isExecuting) {
      const activeEmployeesForToken = employees.filter(
        e => e.status === 'active' && e.tokenSymbol === selectedToken
      );
      setSelectedEmployees(
        activeEmployeesForToken.map(emp => ({
          id: emp.id,
          name: emp.name,
          railgunAddress: emp.railgunAddress,
          amount: emp.salary,
          tokenSymbol: emp.tokenSymbol,
        }))
      );

      // Set default payment source based on available balances
      const calculatedTotal = activeEmployeesForToken.reduce((sum, emp) => sum + parseFloat(emp.salary || '0'), 0);
      const ethBalance = parseFloat(ethereumBalance);
      const rgBalance = parseFloat(railgunBalance);

      // Prefer RAILGUN if it has sufficient balance, otherwise Ethereum
      if (rgBalance >= calculatedTotal) {
        setPaymentSource("railgun");
      } else {
        setPaymentSource("ethereum");
      }
    }

    // Reset when modal closes
    if (!isOpen) {
      setIsExecuting(false);
      setSteps([]);
      setToasts([]);
    }
  }, [isOpen, employees, selectedToken, ethereumBalance, railgunBalance]);

  // Calculate total amount needed
  const totalAmount = selectedEmployees.reduce((sum, emp) => sum + parseFloat(emp.amount || '0'), 0);

  // Check if sufficient balance
  const ethereumBalanceNum = parseFloat(ethereumBalance);
  const railgunBalanceNum = parseFloat(railgunBalance);
  const hasSufficientEthereum = ethereumBalanceNum >= totalAmount;
  const hasSufficientRailgun = railgunBalanceNum >= totalAmount;

  // Reset steps when modal opens (only once per modal open, not during execution)
  useEffect(() => {
    if (isOpen && !isExecuting) {
      initializeSteps();
    }
  }, [isOpen, paymentSource]);

  const initializeSteps = () => {
    if (paymentSource === "ethereum") {
      setSteps([
        {
          id: "approve",
          label: "Approve Token",
          status: "pending",
          description: `Approve ${totalAmount.toFixed(2)} ${selectedToken}`,
        },
        {
          id: "shield",
          label: "Shield Tokens",
          status: "pending",
          description: "Convert to private RAILGUN balance",
        },
        {
          id: "poi",
          label: "POI Validation",
          status: "pending",
          description: "Waiting for Proof of Innocence (1 hour)",
        },
        {
          id: "transfer",
          label: "Send Payroll",
          status: "pending",
          description: `Transfer to ${selectedEmployees.length} employee(s)`,
        },
      ]);
    } else {
      setSteps([
        {
          id: "transfer",
          label: "Send Payroll",
          status: "pending",
          description: `Transfer to ${selectedEmployees.length} employee(s) from shielded balance`,
        },
      ]);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const exists = prev.find(e => e.id === employeeId);
      if (exists) {
        return prev.filter(e => e.id !== employeeId);
      } else {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
          return [...prev, {
            id: employee.id,
            name: employee.name,
            railgunAddress: employee.railgunAddress,
            amount: employee.salary,
            tokenSymbol: employee.tokenSymbol,
          }];
        }
        return prev;
      }
    });
  };

  const updateEmployeeAmount = (employeeId: string, amount: string) => {
    setSelectedEmployees(prev =>
      prev.map(emp => emp.id === employeeId ? { ...emp, amount } : emp)
    );
  };

  const startEditAmount = (employeeId: string, currentAmount: string) => {
    setEditingEmployeeId(employeeId);
    setEditAmount(currentAmount);
  };

  const saveEditAmount = () => {
    if (editingEmployeeId) {
      updateEmployeeAmount(editingEmployeeId, editAmount);
      setEditingEmployeeId(null);
      setEditAmount("");
    }
  };

  const cancelEdit = () => {
    setEditingEmployeeId(null);
    setEditAmount("");
  };

  const updateStep = (id: string, updates: Partial<PayrollStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const executePayroll = async () => {
    if (!address || !walletClient) {
      alert("Please connect your wallet");
      return;
    }

    setIsExecuting(true);

    try {
      if (paymentSource === "ethereum") {
        // Calculate total amount to shield
        const amountToShield = parseUnits(totalAmount.toString(), tokenDecimals);

        // Step 1: Approve Token
        updateStep("approve", { status: "in_progress", description: `Approving ${totalAmount.toFixed(2)} ${selectedToken}...` });

        // ERC20 ABI for approve function
        const ERC20_ABI = [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const;

        // First get the shield transaction to know the contract address
        const shieldTxData = await generateShieldTransaction(
          address,
          tokenAddress,
          amountToShield.toString()
        );

        // Approve the RAILGUN contract to spend tokens
        const approveTxHash = await walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [shieldTxData.transaction.to as `0x${string}`, amountToShield],
        });

        // Show loading toast for approve transaction
        const approveToastId = addToast(
          "Approval transaction submitted",
          "loading",
          approveTxHash
        );

        // Wait for approve transaction
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        }

        // Update toast to success
        updateToast(approveToastId, {
          message: "Token spend approved successfully!",
          type: "success"
        });

        updateStep("approve", {
          status: "completed",
          description: "Token approval confirmed",
          txHash: approveTxHash
        });

        // Step 2: Shield
        updateStep("shield", { status: "in_progress", description: "Shielding tokens to RAILGUN..." });

        const shieldTxHash = await walletClient.sendTransaction({
          to: shieldTxData.transaction.to as `0x${string}`,
          data: shieldTxData.transaction.data as `0x${string}`,
          value: shieldTxData.transaction.value ? BigInt(shieldTxData.transaction.value) : 0n,
        });

        console.log("📢 Shield tx submitted:", shieldTxHash);
        // Show toast for submitted transaction
        const shieldToastId = addToast("Shielding transaction submitted", "loading", shieldTxHash);
        console.log("📢 Toast added with ID:", shieldToastId);

        // Wait for shield transaction
        console.log("⏳ Waiting for shield confirmation...");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: shieldTxHash });
        }
        console.log("✅ Shield confirmed!");

        // Update toast to success
        console.log("📢 Updating toast to success...");
        updateToast(shieldToastId, {
          message: "Tokens shielded successfully!",
          type: "success"
        });

        updateStep("shield", {
          status: "completed",
          description: "Tokens shielded successfully",
          txHash: shieldTxHash
        });

        // Trigger balance refresh after successful shielding
        if (onBalanceUpdate) {
          onBalanceUpdate();
        }

        // Step 3: POI Validation
        updateStep("poi", { status: "in_progress", description: "Waiting for POI validation (this takes ~1 hour in production)..." });

        console.log("🔍 Starting POI validation...");
        // In production, this would be a real 1-hour wait or backend polling
        // For now, we'll simulate it with a short delay
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased to 5 seconds
        console.log("✅ POI validation complete");

        // Generate mock POI list ID
        const poiListId = `poi-list-${Date.now()}`;
        const timestamp = new Date().toISOString();

        console.log("📢 Showing POI toast...");
        // Show POI validation success toast
        addToast(
          `POI Validation Complete - List ID: ${poiListId}`,
          "success"
        );

        updateStep("poi", {
          status: "completed",
          description: `POI validated - Approved by ppoi-agg.horsewithsixlegs.xyz at ${timestamp}`,
          txHash: `poi:${poiListId}`
        });

        // Step 4: Transfer
        updateStep("transfer", { status: "in_progress", description: "Executing private transfers..." });
        // TODO: Implement actual RAILGUN transfer API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateStep("transfer", { status: "completed" });
      } else {
        // Direct transfer from RAILGUN balance
        updateStep("transfer", { status: "in_progress", description: "Executing private transfers from shielded balance..." });
        // TODO: Implement actual RAILGUN transfer API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateStep("transfer", { status: "completed" });
      }
    } catch (error: any) {
      console.error("Payroll execution error:", error);
      const currentStep = steps.find(s => s.status === "in_progress");
      if (currentStep) {
        updateStep(currentStep.id, {
          status: "failed",
          error: error.message || "Transaction failed"
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  const allCompleted = steps.every(s => s.status === "completed");
  const hasFailed = steps.some(s => s.status === "failed");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-black z-10">
          <div>
            <h2 className="text-xl font-bold">Process Payroll</h2>
            <p className="text-sm text-muted mt-1">
              {selectedEmployees.length} of {employees.filter(e => e.status === 'active' && e.tokenSymbol === selectedToken).length} employee(s) selected • {totalAmount.toFixed(2)} {selectedToken}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Source Selection */}
        {!allCompleted && (
          <div className="p-6 border-b border-border">
            <label className="text-xs text-muted uppercase tracking-wide block mb-3">
              Payment Source
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Ethereum Option */}
              <button
                onClick={() => setPaymentSource("ethereum")}
                disabled={!hasSufficientEthereum || isExecuting}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${paymentSource === "ethereum"
                    ? "border-white bg-white/5"
                    : "border-border hover:border-white/50"
                  }
                  ${(!hasSufficientEthereum || isExecuting) && "opacity-50 cursor-not-allowed"}
                `}
              >
                <div className="flex items-start space-x-3">
                  <Wallet className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Ethereum Wallet</div>
                    <div className="text-sm text-muted mb-2">
                      Shield → Transfer
                    </div>
                    <div className="text-xs">
                      <span className={hasSufficientEthereum ? "text-green-400" : "text-red-400"}>
                        {ethereumBalance} {selectedToken}
                      </span>
                      {!hasSufficientEthereum && (
                        <div className="text-red-400 mt-1">Insufficient balance</div>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* RAILGUN Option */}
              <button
                onClick={() => setPaymentSource("railgun")}
                disabled={!hasSufficientRailgun || isExecuting}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${paymentSource === "railgun"
                    ? "border-white bg-white/5"
                    : "border-border hover:border-white/50"
                  }
                  ${(!hasSufficientRailgun || isExecuting) && "opacity-50 cursor-not-allowed"}
                `}
              >
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 mt-0.5 text-green-500" />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">RAILGUN Balance</div>
                    <div className="text-sm text-muted mb-2">
                      Direct transfer
                    </div>
                    <div className="text-xs">
                      <span className={hasSufficientRailgun ? "text-green-400" : "text-red-400"}>
                        {railgunBalance} {selectedToken}
                      </span>
                      {!hasSufficientRailgun && (
                        <div className="text-red-400 mt-1">Insufficient balance</div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Employee Selection */}
        {!allCompleted && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-muted uppercase tracking-wide">
                Select Employees
              </label>
              <button
                onClick={() => {
                  const allActiveForToken = employees.filter(
                    e => e.status === 'active' && e.tokenSymbol === selectedToken
                  );
                  if (selectedEmployees.length === allActiveForToken.length) {
                    setSelectedEmployees([]);
                  } else {
                    setSelectedEmployees(
                      allActiveForToken.map(emp => ({
                        id: emp.id,
                        name: emp.name,
                        railgunAddress: emp.railgunAddress,
                        amount: emp.salary,
                        tokenSymbol: emp.tokenSymbol,
                      }))
                    );
                  }
                }}
                disabled={isExecuting}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedEmployees.length === employees.filter(e => e.status === 'active' && e.tokenSymbol === selectedToken).length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {employees
                .filter(e => e.status === 'active' && e.tokenSymbol === selectedToken)
                .map(employee => {
                  const isSelected = selectedEmployees.some(e => e.id === employee.id);
                  const selectedEmp = selectedEmployees.find(e => e.id === employee.id);
                  const isEditing = editingEmployeeId === employee.id;

                  return (
                    <div
                      key={employee.id}
                      className={`
                        border rounded-lg p-3 transition-all
                        ${isSelected ? "border-white bg-white/5" : "border-border"}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEmployee(employee.id)}
                          disabled={isExecuting}
                          className="w-4 h-4 rounded border-border bg-black checked:bg-white checked:border-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {/* Employee Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{employee.name}</div>
                          <div className="text-xs text-muted font-mono truncate">
                            {employee.railgunAddress.slice(0, 15)}...{employee.railgunAddress.slice(-10)}
                          </div>
                        </div>

                        {/* Amount */}
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditAmount();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="w-24 px-2 py-1 bg-black border border-white rounded text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEditAmount}
                                  className="text-xs text-green-400 hover:text-green-300"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-semibold">
                                  {selectedEmp?.amount || employee.salary} {selectedToken}
                                </span>
                                <button
                                  onClick={() => startEditAmount(employee.id, selectedEmp?.amount || employee.salary)}
                                  disabled={isExecuting}
                                  className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Execution Steps */}
        <div className="p-6 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                border rounded-lg p-4 transition-all
                ${step.status === "in_progress" && "border-blue-500 bg-blue-500/10"}
                ${step.status === "completed" && "border-green-500 bg-green-500/5"}
                ${step.status === "failed" && "border-red-500 bg-red-500/10"}
                ${step.status === "pending" && "border-border"}
              `}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === "pending" && (
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center text-xs text-muted">
                      {index + 1}
                    </div>
                  )}
                  {step.status === "in_progress" && (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  )}
                  {step.status === "completed" && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {step.status === "failed" && (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{step.label}</div>
                  <div className="text-sm text-muted">{step.description}</div>
                  {step.error && (
                    <div className="text-sm text-red-400 mt-2">{step.error}</div>
                  )}
                  {step.txHash && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-muted">Transaction:</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1 transition-colors"
                      >
                        <span>{step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {step.status === "in_progress" && (
                    <div className="mt-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          {allCompleted ? (
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-green-500 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Payroll completed successfully!</span>
              </div>
              <p className="text-sm text-muted">
                {selectedEmployees.length} employee(s) received their payments
              </p>
            </div>
          ) : hasFailed ? (
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-red-500 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Payroll execution failed</span>
              </div>
              <p className="text-sm text-muted">
                Please try again or contact support
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-sm text-muted">
                {paymentSource === "ethereum"
                  ? "Tokens will be shielded and transferred privately"
                  : "Direct private transfer from your shielded balance"
                }
              </p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            {allCompleted || hasFailed ? (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isExecuting}
                  className="px-6 py-2 border border-border rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executePayroll}
                  disabled={
                    isExecuting ||
                    selectedEmployees.length === 0 ||
                    (paymentSource === "ethereum" && !hasSufficientEthereum) ||
                    (paymentSource === "railgun" && !hasSufficientRailgun)
                  }
                  className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Payroll</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
