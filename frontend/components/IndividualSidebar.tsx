"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Building2, Settings } from "lucide-react";
import { ViewSwitcher } from "./ViewSwitcher";

const menuItems = [
  { name: "Dashboard", href: "/individual", icon: LayoutDashboard },
  { name: "Payments", href: "/individual/payments", icon: Receipt },
  { name: "Employers", href: "/individual/employers", icon: Building2 },
  { name: "Settings", href: "/individual/settings", icon: Settings },
];

export default function IndividualSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-black border-r border-border min-h-screen p-6 flex flex-col">
      {/* Top Section */}
      <div className="space-y-4 mb-8">
        {/* Logo */}
        <div>
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.jpeg"
              alt="Payload Logo"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-lg font-bold">PAYLOAD</span>
          </Link>
          <p className="text-xs text-muted mt-2 uppercase tracking-wider">Individual View</p>
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
