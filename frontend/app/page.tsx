"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Github, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.jpeg"
              alt="Payload Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-xl font-bold tracking-tight">PAYLOAD</span>
          </div>

          <nav className="flex items-center space-x-6 text-sm">
            <Link href="#" className="hover:text-muted transition-colors">
              <FileText className="w-4 h-4 inline mr-1" />
              Docs
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              className="hover:text-muted transition-colors"
            >
              <Github className="w-4 h-4 inline mr-1" />
              Github
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Private Payroll
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Pay your team privately using zero-knowledge proofs. <br />
              Built on RAILGUN. Powered by Ethereum.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/employer"
              className="group inline-flex items-center space-x-2 bg-white text-black px-8 py-4 hover:bg-gray-200 transition-colors text-lg font-semibold"
            >
              <span>Enter App</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center space-x-8 text-sm text-muted">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ethereum Sepolia</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>RAILGUN v3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border p-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted">
          <p>Built with privacy in mind. No tracking. No data collection.</p>
        </div>
      </footer>
    </main>
  );
}
