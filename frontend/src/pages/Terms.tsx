import React from "react";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Terms of Service & Privacy Policy</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. User Agreement</h2>
        <p className="text-slate-700 mb-2">
          By registering and using PoultryYield, you agree to abide by all platform rules, investment terms, and local regulations. You must be at least 18 years old and provide accurate, up-to-date information during onboarding and KYC verification.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Privacy & Data Protection</h2>
        <p className="text-slate-700 mb-2">
          We value your privacy. All personal data, including identity documents, contact details, and transaction history, are securely stored and encrypted. Data is used solely for account management, compliance, and service improvement. We do not sell or share your information with third parties except as required by law or for regulatory compliance.
        </p>
        <ul className="list-disc pl-6 text-slate-700">
          <li>Data is processed in accordance with Ghana Data Protection Act and international standards.</li>
          <li>You may request data deletion or correction at any time by contacting support.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Investment Terms & Risks</h2>
        <p className="text-slate-700 mb-2">
          Investments in Egg Notes and Chicken Notes are subject to agricultural, market, and operational risks. Returns are not guaranteed and may vary due to feed prices, market demand, and farm performance. Principal protection is supported by insurance and risk reserves, but losses may occur in rare circumstances.
        </p>
        <ul className="list-disc pl-6 text-slate-700">
          <li>Minimum investment amounts apply per product.</li>
          <li>Payouts are credited to your wallet as per batch schedules.</li>
          <li>Early exit is allowed for Egg Notes after the first month; Chicken Notes lock until harvest.</li>
          <li>Read full risk disclosure before investing.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Security & Compliance</h2>
        <p className="text-slate-700 mb-2">
          PoultryYield operates under Ghana’s agribusiness co-investment guidelines and complies with Bank of Ghana’s electronic money regulations. Funds are held in secure escrow accounts until deployed to batches. All partner farms are vetted, insured, and monitored for compliance and biosecurity.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Account Usage & Termination</h2>
        <p className="text-slate-700 mb-2">
          You are responsible for maintaining the confidentiality of your login credentials. PoultryYield reserves the right to suspend or terminate accounts for fraudulent activity, non-compliance, or abuse of platform services.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Contact & Support</h2>
        <p className="text-slate-700 mb-2">
          For questions, data requests, or legal inquiries, contact our support team at <a href="mailto:help@poultryinvest.africa" className="underline text-brand-700">help@poultryinvest.africa</a>.
        </p>
      </section>
      <div className="text-xs text-slate-500 mt-8">
        Last updated: September 3, 2025
      </div>
    </div>
  );
}
