"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, User } from "lucide-react";

export function ViewSwitcher() {
  const pathname = usePathname();
  const isEmployer = pathname.startsWith("/employer");
  const isIndividual = pathname.startsWith("/individual");

  return (
    <div className="flex items-center space-x-1 border border-border rounded p-1">
      <Link
        href="/employer"
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded text-xs transition-colors
          ${isEmployer ? "bg-white text-black" : "text-white hover:bg-white/10"}
        `}
      >
        <Building2 className="w-3 h-3" />
        <span>Employer</span>
      </Link>

      <Link
        href="/individual"
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded text-xs transition-colors
          ${isIndividual ? "bg-white text-black" : "text-white hover:bg-white/10"}
        `}
      >
        <User className="w-3 h-3" />
        <span>Individual</span>
      </Link>
    </div>
  );
}
