"use client";

import IndividualSidebar from "@/components/IndividualSidebar";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function IndividualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black">
      <IndividualSidebar />
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border p-6 flex justify-end">
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
