export default function HowToUsePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">How to Use</h1>
        <p className="text-sm text-muted">
          A step-by-step guide to using Payload
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">For Employers</h2>

          <div className="space-y-4">
            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">1. Connect Your Wallet</h3>
              <p className="text-sm text-white/70">
                Connect your Ethereum wallet and ensure you're on Sepolia testnet.
              </p>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">2. Get Testnet Tokens</h3>
              <p className="text-sm text-white/70 mb-2">
                Use the faucet buttons: "Get USDC" opens Circle's faucet, "Get PYUSD" requests 100 PYUSD directly.
              </p>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">3. Add Employees</h3>
              <p className="text-sm text-white/70 mb-2">
                Click "Add Employee" and enter their RAILGUN address and salary details.
              </p>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">4. Execute Payroll</h3>
              <p className="text-sm text-white/70 mb-2">
                Click "Execute Payroll", select payment source, choose employees, and confirm.
                The modal handles shielding automatically if paying from your Ethereum wallet.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-3">For Employees</h2>

          <div className="space-y-4">
            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">1. Connect Your Wallet</h3>
              <p className="text-sm text-white/70">
                Navigate to the employee portal and connect your Ethereum wallet on Sepolia testnet.
              </p>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">2. View Your Balance</h3>
              <p className="text-sm text-white/70 mb-2">
                Check your private RAILGUN balance on the dashboard:
              </p>
              <ul className="list-disc list-inside text-sm text-white/60 ml-4 space-y-1">
                <li>Private balance shows funds received via RAILGUN</li>
                <li>Public balance shows unshielded funds</li>
              </ul>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">3. Unshield Your Tokens</h3>
              <p className="text-sm text-white/70 mb-2">
                When you need to use your funds:
              </p>
              <ul className="list-disc list-inside text-sm text-white/60 ml-4 space-y-1">
                <li>Click "Unshield" on your private balance card</li>
                <li>Enter the amount to unshield</li>
                <li>Confirm the transaction</li>
                <li>Tokens will appear in your public wallet</li>
              </ul>
            </div>

            <div className="border-l-2 border-white/20 pl-4">
              <h3 className="text-base font-semibold mb-2">4. View Payment History</h3>
              <p className="text-sm text-white/70">
                Check the payments tab to see your salary payment history and status.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-3">Important Notes</h2>
          <div className="bg-white/5 border border-border rounded-lg p-4 space-y-2 text-sm">
            <p className="text-white/70">
              <strong className="text-white">Testnet Only:</strong> This is a testnet deployment. Use Sepolia testnet and testnet tokens only.
            </p>
            <p className="text-white/70">
              <strong className="text-white">Security Warning:</strong> The current deployment is not secure. RAILGUN wallets are managed server-side without authentication. Do not use with real funds.
            </p>
            <p className="text-white/70">
              <strong className="text-white">RAILGUN Address:</strong> Your RAILGUN address is different from your Ethereum address. Make sure to use the correct address when adding employees.
            </p>
            <p className="text-white/70">
              <strong className="text-white">Gas Fees:</strong> You'll need Sepolia ETH for gas fees. Get it from a Sepolia faucet.
            </p>
            <p className="text-white/70">
              <strong className="text-white">Transaction Time:</strong> RAILGUN transactions may take longer than regular Ethereum transactions due to proof generation.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="text-xl font-semibold mb-3">Contributing & Support</h2>
          <div className="space-y-3 text-sm">
            <p className="text-white/70">
              <strong className="text-white">Found a bug?</strong> Please report issues on our{" "}
              <a
                href="https://github.com/mohammed7s/payload/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                GitHub Issues
              </a>{" "}
              page.
            </p>
            <p className="text-white/70">
              <strong className="text-white">Want to contribute?</strong> We welcome contributions! Check out our{" "}
              <a
                href="https://github.com/mohammed7s/payload"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                GitHub repository
              </a>{" "}
              to get started.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
