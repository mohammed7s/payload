"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Wallet, Shield, ArrowRight, Plus, Mail, Upload, ChevronDown, Send, Droplet } from "lucide-react";
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
import { PayrollExecutionModal } from "@/components/PayrollExecutionModal";
import { TokenLogo } from "@/components/TokenLogo";

// Token configuration (Sepolia testnet)
const TOKEN_CONFIG: Record<string, { address: string; decimals: number }> = {
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
    decimals: 6,
  },
  PYUSD: {
    address: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", // PYUSD on Sepolia
    decimals: 6,
  },
};

export default function EmployerDashboard() {
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isInviteEmployeeOpen, setIsInviteEmployeeOpen] = useState(false);
  const [isImportCSVOpen, setIsImportCSVOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState<{ usdc: boolean; pyusd: boolean }>({ usdc: false, pyusd: false });
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { balances, isLoading } = useTokenBalances();
  const { railgunWallet, isLoading: railgunLoading, error: railgunError } = useRailgunWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get shielded balances
  const { balance: shieldedUSDC, isLoading: loadingUSDC, refetch: refetchUSDC } = useShieldedBalance('USDC', chainId);
  const { balance: shieldedPYUSD, isLoading: loadingPYUSD, refetch: refetchPYUSD } = useShieldedBalance('PYUSD', chainId);

  // Get employees
  const { employees, isLoading: loadingEmployees, error: employeesError, refetch: refetchEmployees } = useEmployees(address);

  // Get ETH balance
  const ethBalance = balances.find((b) => b.symbol === "ETH");

  // Get token balances (USDC, PYUSD)
  const tokenBalances = balances.filter((b) => b.symbol !== "ETH");

  // Get current token balance
  const currentTokenBalance = tokenBalances.find((b) => b.symbol === selectedToken);
  const currentShieldedBalance = selectedToken === "USDC" ? shieldedUSDC : shieldedPYUSD;

  // Faucet functions
  const requestUSDCFaucet = () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    // Redirect directly to Circle's faucet
    window.open("https://faucet.circle.com/", "_blank");
  };

  const requestPYUSDFaucet = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    setFaucetLoading({ ...faucetLoading, pyusd: true });
    try {
      const response = await fetch("/api/faucet/pyusd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (data.success) {
        const message = `PYUSD Faucet Success!\n\n100 PYUSD sent to ${address}\n\nPage will refresh in 3 seconds to show new balance.`;
        alert(message);

        // Refresh page after 3 seconds to show new balance
        setTimeout(() => window.location.reload(), 3000);
      } else {
        alert(data.error || "PYUSD Faucet request failed. Please try again later.");
      }
    } catch (error) {
      console.error("PYUSD Faucet error:", error);
      alert("Failed to request PYUSD from faucet");
    } finally {
      setFaucetLoading({ ...faucetLoading, pyusd: false });
    }
  };

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

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
                      <div key={token.symbol} className="flex items-center gap-2">
                        <Image
                          src={token.symbol === "USDC" ? "/usdc-logo.png" : "/paypal-icon.svg"}
                          alt={`${token.symbol} logo`}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <p className="text-lg font-semibold">
                          {token.formatted} {token.symbol}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Image
                          src="/usdc-logo.png"
                          alt="USDC logo"
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <p className="text-lg font-semibold text-muted">0.00 USDC</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image
                          src="/paypal-icon.svg"
                          alt="PYUSD logo"
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <p className="text-lg font-semibold text-muted">0.00 PYUSD</p>
                      </div>
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/usdc-logo.png"
                        alt="USDC logo"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <h3 className="text-2xl font-bold">{shieldedUSDC} USDC</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/paypal-icon.svg"
                        alt="PYUSD logo"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <p className="text-lg font-semibold text-muted">{shieldedPYUSD} PYUSD</p>
                    </div>
                  </div>
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

      {/* Testnet Faucets */}
      <div className="border border-border rounded-lg p-6 bg-black">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Testnet Faucets</h2>
            <p className="text-xs text-muted">Get free testnet tokens to try the platform</p>
          </div>
          <Droplet className="w-5 h-5 text-muted" />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={requestUSDCFaucet}
            disabled={!isConnected}
            className="flex-1 text-sm px-4 py-3 border border-border hover:bg-white hover:text-black transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Image
              src="/usdc-logo.png"
              alt="USDC"
              width={16}
              height={16}
              className="rounded-full"
            />
            <Droplet className="w-4 h-4" />
            <span>Get USDC →</span>
          </button>
          <button
            onClick={requestPYUSDFaucet}
            disabled={!isConnected || faucetLoading.pyusd}
            className="flex-1 text-sm px-4 py-3 border border-border hover:bg-white hover:text-black transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Image
              src="/paypal-icon.svg"
              alt="PYUSD"
              width={16}
              height={16}
              className="rounded-full"
            />
            <Droplet className="w-4 h-4" />
            <span>{faucetLoading.pyusd ? "Requesting..." : "Get PYUSD"}</span>
          </button>
        </div>
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
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-black border-b border-border p-6">
          <h2 className="text-lg font-semibold mb-2">Process Payroll</h2>
          <p className="text-xs text-muted">
            Execute private batch payments to your employees
          </p>
        </div>

        <div className="p-6">
          {/* Token Selection */}
          <div className="mb-6">
            <label className="text-xs text-muted uppercase tracking-wide block mb-3">
              Payment Token
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["USDC", "PYUSD"].map((token) => {
                const balance = tokenBalances.find((b) => b.symbol === token);
                const shieldedBalance = token === "USDC" ? shieldedUSDC : shieldedPYUSD;
                const employeeCount = employees.filter(
                  e => e.status === 'active' && e.tokenSymbol === token
                ).length;

                return (
                  <button
                    key={token}
                    onClick={() => setSelectedToken(token)}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${
                        selectedToken === token
                          ? "border-white bg-white/5"
                          : "border-border hover:border-white/50"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <TokenLogo symbol={token as 'USDC' | 'PYUSD'} size={20} />
                        <span className="font-semibold">{token}</span>
                      </div>
                      {selectedToken === token && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Ethereum:</span>
                        <span className="font-mono">{balance?.formatted || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">RAILGUN:</span>
                        <span className="font-mono text-green-400">{shieldedBalance}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border/50">
                        <span className="text-muted">Employees:</span>
                        <span className="font-semibold">{employeeCount}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-border rounded-lg p-3">
              <div className="text-xs text-muted mb-1">Active Employees</div>
              <div className="text-xl font-bold">
                {employees.filter(e => e.status === 'active' && e.tokenSymbol === selectedToken).length}
              </div>
            </div>
            <div className="bg-white/5 border border-border rounded-lg p-3">
              <div className="text-xs text-muted mb-1">Total Monthly</div>
              <div className="text-xl font-bold">
                {employees
                  .filter(e => e.status === 'active' && e.tokenSymbol === selectedToken)
                  .reduce((sum, emp) => sum + parseFloat(emp.salary || '0'), 0)
                  .toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 border border-border rounded-lg p-3">
              <div className="text-xs text-muted mb-1">Available</div>
              <div className="text-xl font-bold text-green-400">
                {currentShieldedBalance}
              </div>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={() => setIsPayrollModalOpen(true)}
            disabled={!isConnected || !railgunWallet || employees.filter(e => e.status === 'active' && e.tokenSymbol === selectedToken).length === 0}
            className="w-full bg-white text-black py-4 font-semibold hover:bg-gray-200 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Process {selectedToken} Payroll</span>
          </button>

          {(!isConnected || !railgunWallet) && (
            <p className="text-xs text-center text-muted mt-3">
              {!isConnected ? "Connect your wallet to continue" : "Waiting for RAILGUN wallet..."}
            </p>
          )}
        </div>
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

      {/* Payroll Execution Modal */}
      <PayrollExecutionModal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        employees={employees}
        selectedToken={selectedToken}
        ethereumBalance={currentTokenBalance?.formatted || "0.00"}
        railgunBalance={currentShieldedBalance || "0.00"}
        tokenAddress={TOKEN_CONFIG[selectedToken].address}
        tokenDecimals={TOKEN_CONFIG[selectedToken].decimals}
        onBalanceUpdate={() => {
          // Refetch the appropriate shielded balance after shielding
          if (selectedToken === "USDC") {
            refetchUSDC();
          } else {
            refetchPYUSD();
          }
        }}
      />
    </div>
  );
}
