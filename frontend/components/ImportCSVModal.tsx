"use client";

import { X, Upload, Download, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  employerAddress: string;
  onSuccess?: () => void;
}

export function ImportCSVModal({ isOpen, onClose, employerAddress, onSuccess }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setErrorMessage("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setErrorMessage("");
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const template = `name,railgun_address,salary,token
John Doe,0zk1qyvrxx4tyfnjawp9eh63hmx2fzsgqu7exfly,1000,USDC
Jane Smith,0zk1qyt35wdazqkpuzss5un9uahzkpg7qsrll6km,1500,PYUSD
Bob Johnson,0zk1qy8xjfdxfesph2jshr67zfd829pwhstdqkxw,2000,USDC`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMessage("Please select a CSV file");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Mock CSV processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random number of imports
      const count = Math.floor(Math.random() * 5) + 3;
      setImportedCount(count);
      setSuccessMessage(`Successfully imported ${count} employees from CSV!`);

      // Reset and close after delay
      setTimeout(() => {
        setFile(null);
        setSuccessMessage("");
        setImportedCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (error) {
      console.error("CSV import error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to import CSV");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-border max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Upload className="w-5 h-5" />
            <h2 className="text-xl font-bold">Import Employees from CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="border border-blue-500 bg-blue-500/10 p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-muted space-y-2">
                <p className="text-white font-semibold">CSV Format:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Columns: name, railgun_address, salary, token</li>
                  <li>Token must be either USDC or PYUSD</li>
                  <li>RAILGUN addresses must start with 0zk</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center space-x-2 p-3 border border-border hover:bg-white/5 transition-colors text-sm"
            disabled={isProcessing}
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>

          {/* File Upload */}
          <div>
            <label className="block text-sm text-muted mb-2">Select CSV File</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full p-6 border-2 border-dashed border-border hover:border-white/50 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted" />
                  {file ? (
                    <div>
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">Click to upload CSV</p>
                      <p className="text-xs text-muted mt-1">or drag and drop</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="border border-red-500 bg-red-500/10 p-4">
              <p className="text-sm text-red-500">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="border border-green-500 bg-green-500/10 p-4">
              <p className="text-sm text-green-500">✅ {successMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 p-4 border border-border hover:bg-white/5 transition-colors font-semibold"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="flex-1 p-4 bg-white text-black hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !file || !!successMessage}
            >
              {isProcessing ? "Importing..." : "Import Employees"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
