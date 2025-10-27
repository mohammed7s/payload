export default function HowItWorksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">How It Works</h1>
        <p className="text-sm text-muted">
          Understanding Payload's private payroll system
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Overview</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Payload is a privacy-preserving payroll system that uses RAILGUN as its backend for zero-knowledge proof
            transactions. It enables employers to pay salaries in USDC and PYUSD while maintaining complete privacy
            for both parties, all while remaining compliant with regulatory requirements through RAILGUN's Proof of
            Innocence system.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Why Payload</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            Traditional on-chain payroll systems expose sensitive financial information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/80 ml-4">
            <li>Wallet addresses publicly linked to employer-employee relationships</li>
            <li>Salary amounts visible on-chain</li>
            <li>Employee financial activity exposed to employer</li>
            <li>Payment patterns and schedules analyzable</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">The Solution</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Payload leverages RAILGUN to create a private payment layer:
          </p>

          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2">1. Shielding</h3>
              <p className="text-sm text-white/70">
                Employers shield their USDC/PYUSD tokens into the RAILGUN privacy system.
                Once shielded, the origin and amount become private.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2">2. Private Transfer</h3>
              <p className="text-sm text-white/70">
                Salaries are sent through RAILGUN's zero-knowledge proof system, hiding
                sender, receiver, and amount from public view.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2">3. Proof of Innocence</h3>
              <p className="text-sm text-white/70">
                RAILGUN's POI system ensures funds don't originate from sanctioned addresses,
                maintaining compliance while preserving privacy.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2">4. Unshielding</h3>
              <p className="text-sm text-white/70">
                Employees can unshield their private balance to their public wallet whenever
                they need to use the funds.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Privacy Guarantees</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            RAILGUN's zero-knowledge proof system ensures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/80 ml-4">
            <li>Wallet addresses remain disconnected from employer-employee relationships</li>
            <li>Salary amounts are hidden from public view</li>
            <li>Payment timing and frequency cannot be tracked</li>
            <li>All transactions remain compliant with POI verification</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Supported Tokens</h2>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            Payload currently supports two stablecoins on Ethereum Sepolia testnet:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-1">USDC</h3>
              <p className="text-xs text-white/70">Circle's USD Coin</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-base font-semibold mb-1">PYUSD</h3>
              <p className="text-xs text-white/70">PayPal USD</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
