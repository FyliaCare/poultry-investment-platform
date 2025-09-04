import React from "react";

export default function Risk() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Risk Disclosure</h1>
        <p className="mt-3 text-slate-600 text-lg">
          Investing in agriculture—especially livestock—can provide attractive
          returns, but it is not risk-free. Please review these risk factors carefully
          and invest only what you can afford to lose.
        </p>
      </header>

      {/* Core Risk Sections */}
      <section className="space-y-6">
        <div>
          <h2 className="font-bold text-xl mb-2">1. Market & Price Volatility</h2>
          <p className="text-slate-700">
            Poultry product prices (eggs, live birds) can fluctuate due to supply and
            demand, seasonal trends, feed cost inflation, and broader economic factors.
            Returns may be lower than projected if sale prices drop unexpectedly.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">2. Feed & Input Costs</h2>
          <p className="text-slate-700">
            Feed accounts for 60-70% of poultry production cost. Sudden increases in
            maize, soybean, or additive prices directly affect profitability. Hedging
            and forward contracts reduce but cannot eliminate this exposure.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">3. Biological & Disease Risk</h2>
          <p className="text-slate-700">
            Outbreaks of Avian Influenza, Newcastle Disease, or other illnesses may
            cause increased mortality or culling. Biosecurity, vaccination, and
            veterinary oversight are enforced, but some residual risk always exists.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">4. Operational & Management Risk</h2>
          <p className="text-slate-700">
            Poor farm management, staff turnover, equipment failure, or power outages
            can lead to lower productivity. We mitigate via strict partner-farm vetting,
            redundancy planning, and ongoing monitoring.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">5. Insurance & Reserve Limitations</h2>
          <p className="text-slate-700">
            Insurance policies may cover only certain losses (e.g., catastrophic
            disease) and may exclude market downturns. Reserve funds aim to stabilize
            payouts but are not a guarantee of principal.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">6. Liquidity & Early Exit</h2>
          <p className="text-slate-700">
            Investments in live batches are generally locked until harvest or payout.
            Early exit options may involve a discount or administrative fee depending
            on batch stage and demand for units.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-2">7. Regulatory & Force-Majeure Events</h2>
          <p className="text-slate-700">
            Changes in agricultural policy, new levies, or unforeseen events (natural
            disasters, pandemic restrictions) can disrupt operations or delay returns.
          </p>
        </div>
      </section>

      {/* Mitigation Section */}
      <section className="mt-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="font-bold text-2xl mb-3">Our Mitigation Approach</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-1">
          <li>Partner only with licensed, biosecure farms with strong track records.</li>
          <li>Maintain veterinary protocols, vaccination schedules, and regular audits.</li>
          <li>Use diversified sourcing for feed and negotiate bulk-buy contracts.</li>
          <li>Hold contingency reserves and arrange insurance where practical.</li>
          <li>Provide investors with transparent reporting and batch performance data.</li>
        </ul>
      </section>

      {/* Final Disclaimer */}
      <p className="mt-10 text-sm text-slate-500">
        <strong>Disclaimer:</strong> This disclosure is for informational purposes and
        does not constitute financial advice. Past performance is not indicative of
        future results. Please seek independent advice before making investment
        decisions.
      </p>
    </div>
  );
}
