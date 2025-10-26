"use client";

import { useEffect } from "react";
import { X, CheckCircle, Loader2, ExternalLink } from "lucide-react";

interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "loading" | "info";
  txHash?: string;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, message, type = "info", txHash, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (type !== "loading" && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, type, duration, onClose]);

  return (
    <div className="bg-black border border-border rounded-lg p-4 shadow-lg min-w-[320px] max-w-md animate-slide-in">
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {type === "loading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          {type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
          {type === "info" && <div className="w-5 h-5 rounded-full bg-blue-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1 transition-colors"
            >
              <span>{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: "success" | "loading" | "info";
    txHash?: string;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          txHash={toast.txHash}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
