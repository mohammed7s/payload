"use client";

import { Wallet, History, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/employee", label: "Dashboard", icon: Wallet },
    { href: "/employee/payments", label: "Payment History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/employee" className="text-xl font-bold">
                RAILGUN Payroll
              </Link>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 border border-green-500/30">
                EMPLOYEE
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <NetworkSwitcher />
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border min-h-screen">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-white text-black font-semibold"
                      : "text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
