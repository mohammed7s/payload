"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, ChevronDown } from "lucide-react";
import { useState } from "react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-4 py-2 border border-border rounded hover:bg-white/5 transition-colors"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-black border border-border rounded shadow-lg">
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-white text-black px-4 py-2 hover:bg-gray-200 transition-colors font-semibold text-sm rounded"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-black border border-border rounded shadow-lg z-50">
          {connectors
            .filter((connector, index, self) => {
              // Remove duplicate MetaMask connectors - keep only the first one
              if (connector.name === "MetaMask") {
                return index === self.findIndex((c) => c.name === "MetaMask");
              }
              // If we have MetaMask, hide the generic "Injected" connector
              if (connector.name === "Injected" && self.some((c) => c.name === "MetaMask")) {
                return false;
              }
              return true;
            })
            .map((connector) => {
              // Map connector names to more user-friendly labels
              const getConnectorLabel = (name: string) => {
                if (name === "Injected") return "MetaMask / Browser Wallet";
                if (name === "WalletConnect") return "WalletConnect";
                return name;
              };

              return (
                <button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector });
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-border last:border-b-0"
                >
                  {getConnectorLabel(connector.name)}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
