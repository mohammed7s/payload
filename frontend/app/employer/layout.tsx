"use client";

import EmployerSidebar from "@/components/EmployerSidebar";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black">
      <EmployerSidebar />
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border p-6 flex justify-end items-center space-x-3">
          <NetworkSwitcher />
          <ConnectWallet />
        </div>
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
