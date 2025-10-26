"use client";

import { useState, useEffect } from "react";
import { useSwitchChain, useChainId } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { useAccount } from "wagmi";

export function NetworkSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected) return null;

  const isOnSepolia = chainId === sepolia.id;
  const isOnMainnet = chainId === mainnet.id;

  // Get network name
  const getNetworkName = () => {
    if (chainId === sepolia.id) return "Sepolia";
    if (chainId === mainnet.id) return "Mainnet";
    return `Chain ${chainId}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Network Status Badge */}
      <div
        className={`text-xs px-3 py-2 border rounded font-mono ${
          isOnSepolia
            ? "border-green-500 text-green-500"
            : "border-yellow-500 text-yellow-500"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnSepolia ? "bg-green-500" : "bg-yellow-500"
            } animate-pulse`}
          ></div>
          <span>{getNetworkName()}</span>
        </div>
      </div>

      {/* Switch Button (only show if not on Sepolia) */}
      {!isOnSepolia && (
        <button
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="text-xs px-3 py-2 bg-yellow-500 text-black hover:bg-yellow-400 transition-colors font-semibold"
        >
          Switch to Sepolia
        </button>
      )}
    </div>
  );
}
