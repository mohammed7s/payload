"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileCheck, BarChart3, Settings } from "lucide-react";
import { ViewSwitcher } from "./ViewSwitcher";

const menuItems = [
  { name: "Dashboard", href: "/employer", icon: LayoutDashboard },
  { name: "Employees", href: "/employer/employees", icon: Users },
  { name: "Compliance", href: "/employer/compliance", icon: FileCheck },
  { name: "Reports", href: "/employer/reports", icon: BarChart3 },
  { name: "Settings", href: "/employer/settings", icon: Settings },
];

export default function EmployerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-black border-r border-border min-h-screen p-6 flex flex-col">
      {/* Top Section */}
      <div className="space-y-4 mb-8">
        {/* Logo */}
        <div>
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-white flex items-center justify-center">
              <span className="text-sm font-bold">P</span>
            </div>
            <span className="text-lg font-bold">PAYLOAD</span>
          </Link>
          <p className="text-xs text-muted mt-2 uppercase tracking-wider">Employer View</p>
        </div>

        {/* View Switcher */}
        <ViewSwitcher />
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded
                transition-colors text-sm
                ${
                  isActive
                    ? "bg-white text-black"
                    : "text-white hover:bg-white/10"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="mt-auto pt-6">
        <div className="border border-border rounded p-3 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted">Network</span>
            <span className="text-green-500">Sepolia</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">RAILGUN</span>
            <span className="text-blue-500">v3</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
