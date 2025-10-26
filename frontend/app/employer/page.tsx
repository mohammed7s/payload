"use client";

import { useState, useEffect } from "react";
import { Wallet, Shield, ArrowRight, Plus, Mail, Upload, ChevronDown } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useRailgunWallet } from "@/hooks/useRailgunWallet";
import { useShieldedBalance } from "@/hooks/useShieldedBalance";
import { useEmployees } from "@/hooks/useEmployees";
import { ShieldModal } from "@/components/ShieldModal";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { InviteEmployeeModal } from "@/components/InviteEmployeeModal";
import { ImportCSVModal } from "@/components/ImportCSVModal";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { TokenLogo } from "@/components/TokenLogo";

export default function EmployerDashboard() {
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isInviteEmployeeOpen, setIsInviteEmployeeOpen] = useState(false);
  const [isImportCSVOpen, setIsImportCSVOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { balances, isLoading } = useTokenBalances();
  const { railgunWallet, isLoading: railgunLoading, error: railgunError } = useRailgunWallet();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get shielded balances
  const { balance: shieldedUSDC, isLoading: loadingUSDC } = useShieldedBalance('USDC', chainId);
  const { balance: shieldedPYUSD, isLoading: loadingPYUSD } = useShieldedBalance('PYUSD', chainId);

  // Get employees
  const { employees, isLoading: loadingEmployees, error: employeesError, refetch: refetchEmployees } = useEmployees(address);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get ETH balance
  const ethBalance = balances.find((b) => b.symbol === "ETH");

  // Get token balances (USDC, PYUSD)
  const tokenBalances = balances.filter((b) => b.symbol !== "ETH");

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted text-sm">
          Manage your private payroll operations
        </p>
      </div>

      {/* RAILGUN Status */}
      {!isConnected && (
        <div className="border border-yellow-500 bg-yellow-500/10 p-6">
          <p className="text-sm text-yellow-500">
            Connect your wallet to access RAILGUN private payroll features.
          </p>
        </div>
      )}

      {railgunLoading && isConnected && (
        <div className="border border-border p-6">
          <p className="text-sm text-muted">Loading your RAILGUN wallet...</p>
        </div>
      )}

      {railgunError && (
        <div className="border border-red-500 bg-red-500/10 p-6">
          <p className="text-sm text-red-500">Error: {railgunError}</p>
        </div>
      )}

      {/* Section 1: Balances */}
      <div className="grid grid-cols-2 gap-6">
        {/* Public Balance */}
        <div className="border border-border rounded-lg p-6 bg-black">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Public Wallet Balance
              </p>
              {!isConnected ? (
                <h3 className="text-2xl font-bold text-muted">Connect Wallet</h3>
              ) : isLoading ? (
                <h3 className="text-2xl font-bold text-muted">Loading...</h3>
              ) : (
                <div className="space-y-1">
                  {/* Always show ETH */}
                  <h3 className="text-2xl font-bold">
                    {ethBalance ? ethBalance.formatted : "0.0000"} ETH
                  </h3>
                  {/* Always show tokens */}
                  {tokenBalances.length > 0 ? (
                    tokenBalances.map((token) => (
                      <p key={token.symbol} className="text-lg font-semibold">
                        {token.formatted} {token.symbol}
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-muted">0.00 USDC</p>
                      <p className="text-lg font-semibold text-muted">0.00 PYUSD</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <Wallet className="w-5 h-5 text-muted" />
          </div>
          <p className="text-xs text-muted mb-4">
            {isConnected ? "Ethereum & ERC-20 tokens" : "Connect wallet to view balances"}
          </p>
          <button
            onClick={() => setIsShieldModalOpen(true)}
            disabled={!isConnected || !railgunWallet}
            className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-3 h-3" />
            <span>Shield</span>
          </button>
        </div>

        {/* Private Balance */}
        {railgunWallet ? (
          <div className="border border-border rounded-lg p-6 bg-black">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">
                  Private Balance
                </p>
                {loadingUSDC || loadingPYUSD ? (
                  <h3 className="text-2xl font-bold text-muted">Loading...</h3>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold">{shieldedUSDC} USDC</h3>
                    <p className="text-lg font-semibold text-muted">{shieldedPYUSD} PYUSD</p>
                  </>
                )}
              </div>
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-muted mb-2">RAILGUN shielded balance</p>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-500">Wallet Active</span>
            </div>
            <button className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Unshield</span>
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-6 bg-black flex flex-col items-center justify-center text-center min-h-[200px]">
            <Shield className="w-8 h-8 mb-4 text-muted" />
            <h3 className="text-lg font-bold mb-2">RAILGUN Wallet</h3>
            <p className="text-sm text-muted mb-6 max-w-sm">
              {isConnected ? "Your RAILGUN wallet will be created automatically." : "Connect your Ethereum wallet to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Employee Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-black border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Employees</h2>
          <div className="flex items-center space-x-3">
            {/* Add Employee Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAddOptions(!showAddOptions)}
                className="text-sm flex items-center space-x-2 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showAddOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-black border border-border rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      setIsAddEmployeeOpen(true);
                      setShowAddOptions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-border flex items-center space-x-3"
                  >
                    <Plus className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">Add Manually</p>
                      <p className="text-xs text-muted">Enter RAILGUN address</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsInviteEmployeeOpen(true);
                      setShowAddOptions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-border flex items-center space-x-3"
                  >
                    <Mail className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">Invite by Email</p>
                      <p className="text-xs text-muted">Send invitation link</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setIsImportCSVOpen(true);
                      setShowAddOptions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center space-x-3"
                  >
                    <Upload className="w-4 h-4" />
                    <div>
                      <p className="font-semibold">Import CSV</p>
                      <p className="text-xs text-muted">Bulk upload employees</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loadingEmployees ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted">Loading employees...</p>
            </div>
          ) : employeesError ? (
            <div className="p-8 text-center border-t border-border">
              <p className="text-sm text-red-500">Error: {employeesError}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center border-t border-border">
              <p className="text-sm text-muted mb-2">No employees yet</p>
              <p className="text-xs text-muted">Add your first employee to get started with payroll</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">Name</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">RAILGUN Address</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">Salary</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">Token</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">Status</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wide text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border last:border-b-0 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold">{employee.name}</td>
                    <td className="p-4 font-mono text-sm text-muted">
                      {employee.railgunAddress.slice(0, 20)}...{employee.railgunAddress.slice(-10)}
                    </td>
                    <td className="p-4">{employee.salary}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <TokenLogo symbol={employee.tokenSymbol as 'USDC' | 'PYUSD'} size={16} />
                        <span className="text-xs px-2 py-1 bg-white/10 border border-border">
                          {employee.tokenSymbol}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 ${
                        employee.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsEditEmployeeOpen(true);
                        }}
                        className="text-xs text-white hover:text-muted transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 3: Payroll Processing */}
      <div className="border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Process Payroll</h2>

        {/* Token Selection */}
        <div className="mb-6">
          <label className="text-xs text-muted uppercase tracking-wide block mb-2">
            Select Token
          </label>
          <div className="flex space-x-4">
            {["USDC", "PYUSD"].map((token) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`
                  px-6 py-3 rounded border transition-colors
                  ${
                    selectedToken === token
                      ? "bg-white text-black border-white"
                      : "border-border hover:border-white/50"
                  }
                `}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1: Shield */}
          <div className="border border-border rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Shield Tokens</h3>
                  <p className="text-xs text-muted">
                    Make {selectedToken} private using RAILGUN
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted" />
            </div>
          </div>

          {/* Step 2: Transfer */}
          <div className="border border-border rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Transfer Payroll</h3>
                  <p className="text-xs text-muted">
                    Send private payments to all employees
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted" />
            </div>
          </div>
        </div>

        {/* Process Button */}
        <button className="w-full mt-6 bg-white text-black py-4 font-semibold hover:bg-gray-200 transition-colors rounded">
          Process Payroll Batch
        </button>
      </div>

      {/* Shield Modal */}
      {railgunWallet && (
        <ShieldModal
          isOpen={isShieldModalOpen}
          onClose={() => setIsShieldModalOpen(false)}
          railgunAddress={railgunWallet.railgunAddress}
        />
      )}

      {/* Add Employee Modal */}
      {address && (
        <AddEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          employerAddress={address}
          onSuccess={() => {
            refetchEmployees();
          }}
        />
      )}

      {/* Invite Employee Modal */}
      {address && (
        <InviteEmployeeModal
          isOpen={isInviteEmployeeOpen}
          onClose={() => setIsInviteEmployeeOpen(false)}
          employerAddress={address}
        />
      )}

      {/* Import CSV Modal */}
      {address && (
        <ImportCSVModal
          isOpen={isImportCSVOpen}
          onClose={() => setIsImportCSVOpen(false)}
          employerAddress={address}
          onSuccess={() => {
            refetchEmployees();
          }}
        />
      )}

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditEmployeeOpen}
        onClose={() => {
          setIsEditEmployeeOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={() => {
          refetchEmployees();
        }}
      />
    </div>
  );
}
