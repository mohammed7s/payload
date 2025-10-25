"use client";

import { useState } from "react";
import { Wallet, Shield, ArrowRight, Plus } from "lucide-react";

// Mock data for now
const mockEmployees = [
  {
    id: 1,
    name: "Alice Johnson",
    address: "0zk1qyvrxx4tyfnjawp9eh63hmx2fzsgqu7exfly...",
    salary: "1,000 USDC",
  },
  {
    id: 2,
    name: "Bob Smith",
    address: "0zk1qyt35wdazqkpuzss5un9uahzkpg7qsrll6km...",
    salary: "1,500 USDC",
  },
  {
    id: 3,
    name: "Carol Davis",
    address: "0zk1qy8xjfdxfesph2jshr67zfd829pwhstdqkxw...",
    salary: "2,000 USDC",
  },
];

export default function EmployerDashboard() {
  const [selectedToken, setSelectedToken] = useState("USDC");

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted text-sm">
          Manage your private payroll operations
        </p>
      </div>

      {/* Section 1: Balances */}
      <div className="grid grid-cols-2 gap-6">
        {/* Public Balance */}
        <div className="border border-border rounded-lg p-6 bg-black">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Ethereum Balance
              </p>
              <h3 className="text-2xl font-bold">0.5421 ETH</h3>
            </div>
            <Wallet className="w-5 h-5 text-muted" />
          </div>
          <p className="text-xs text-muted mb-4">Public wallet balance</p>
          <button className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors flex items-center space-x-2">
            <Shield className="w-3 h-3" />
            <span>Shield</span>
          </button>
        </div>

        {/* Shielded Balance */}
        <div className="border border-border rounded-lg p-6 bg-black">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Shielded Balance
              </p>
              <h3 className="text-2xl font-bold">4,500 USDC</h3>
            </div>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs text-muted mb-2">Private RAILGUN balance</p>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-500">POI Validated</span>
          </div>
          <button className="text-xs px-3 py-2 border border-border hover:bg-white hover:text-black transition-colors flex items-center space-x-2">
            <ArrowRight className="w-3 h-3" />
            <span>Unshield</span>
          </button>
        </div>
      </div>

      {/* Section 2: Employee Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-black border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Employees</h2>
          <button className="text-sm flex items-center space-x-2 px-4 py-2 border border-border hover:bg-white/5 transition-colors rounded">
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>0zk Address</th>
                <th>Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-white/5">
                  <td>{employee.name}</td>
                  <td className="font-mono text-sm text-muted">
                    {employee.address}
                  </td>
                  <td>{employee.salary}</td>
                  <td>
                    <button className="text-xs text-white hover:text-muted transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
