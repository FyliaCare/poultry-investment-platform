import { useState } from "react";

/**
 * Local fallback FAQ list — this will render if you haven't connected your API yet.
 * You can replace with API fetch logic later or merge the two.
 */
const seedFaqs = [
  // ACCOUNT & ONBOARDING
  {
    id: "1",
    category: "Account & Onboarding",
    question: "How do I create an account?",
    answer:
      "Click the 'Sign Up' button on the top right, enter your basic details, verify your email or phone, and set a secure password. Once confirmed, you can log in and access your wallet.",
  },
  {
    id: "2",
    category: "Account & Onboarding",
    question: "Do I need to verify my identity (KYC)?",
    answer:
      "Yes. For regulatory compliance and security, you’ll be asked to provide a valid government-issued ID and proof of address. Verification usually takes less than 24 hours.",
  },
  {
    id: "3",
    category: "Account & Onboarding",
    question: "Can I invest from outside Ghana?",
    answer:
      "Currently we accept investors from Ghana and select ECOWAS countries. If you live elsewhere, contact support for upcoming international access.",
  },

  // INVESTING
  {
    id: "4",
    category: "Investing",
    question: "What is an Egg Note?",
    answer:
      "Egg Notes let you invest in layers producing table eggs. You receive monthly payouts based on egg sales after feed and farm costs are deducted.",
  },
  {
    id: "5",
    category: "Investing",
    question: "What is a Chicken Note?",
    answer:
      "Chicken Notes are tied to broiler batches (meat birds). You invest in a cycle of typically 6–8 weeks. After harvest and sale, your principal plus profit is credited to your wallet.",
  },
  {
    id: "6",
    category: "Investing",
    question: "How do I fund my wallet?",
    answer:
      "Go to your Wallet page and click 'Deposit'. Follow prompts for Mobile Money or Bank Transfer. Deposits reflect instantly for MoMo or within 24 hours for bank transfer.",
  },
  {
    id: "7",
    category: "Investing",
    question: "Is there a minimum investment?",
    answer:
      "Yes. Minimum per unit is usually GHS 50 for eggs and GHS 100 for chicken. You can buy as many units as you like up to the batch limit.",
  },
  {
    id: "8",
    category: "Investing",
    question: "Can I diversify across multiple batches?",
    answer:
      "Absolutely. You can spread funds across multiple Egg and Chicken Notes to balance risk and cashflow timing.",
  },

  // PAYOUTS & RETURNS
  {
    id: "9",
    category: "Payouts & Returns",
    question: "When will I receive my returns?",
    answer:
      "Egg Notes pay monthly after eggs are sold. Chicken Notes pay after birds are harvested and sold (6–8 weeks). Payouts go directly to your wallet, which you can withdraw anytime.",
  },
  {
    id: "10",
    category: "Payouts & Returns",
    question: "How much ROI can I expect?",
    answer:
      "Returns vary with feed prices and market demand. Egg Notes typically yield 10–14% annually. Chicken Notes average 8–12% per 6–8 week cycle. Past performance is not a guarantee of future results.",
  },
  {
    id: "11",
    category: "Payouts & Returns",
    question: "How do I withdraw funds?",
    answer:
      "Go to Wallet > Withdraw, enter an amount, and confirm. Mobile Money withdrawals are processed instantly; bank transfers may take up to 24 hours.",
  },
  {
    id: "12",
    category: "Payouts & Returns",
    question: "Can I reinvest automatically?",
    answer:
      "Yes. Enable 'Auto-Reinvest' in your Portfolio settings. Your earnings will be rolled into new batches of your chosen product automatically.",
  },

  // SECURITY & RISK
  {
    id: "13",
    category: "Security & Risk",
    question: "Is my money safe?",
    answer:
      "Funds are held in a secure escrow until deployed to active batches. Partner farms are vetted, insured, and monitored with IoT sensors. We also maintain a risk reserve to cushion unexpected losses.",
  },
  {
    id: "14",
    category: "Security & Risk",
    question: "What happens if birds die or yields drop?",
    answer:
      "Each farm follows strict biosecurity protocols and we insure against catastrophic loss. Moderate losses may reduce ROI but your principal is largely protected by reserves and insurance.",
  },
  {
    id: "15",
    category: "Security & Risk",
    question: "Is this regulated?",
    answer:
      "We operate under Ghana’s agribusiness co-investment guidelines and are in compliance with Bank of Ghana’s electronic money regulations. Our auditor reviews all statements quarterly.",
  },
  {
    id: "16",
    category: "Security & Risk",
    question: "Can I exit an investment early?",
    answer:
      "Early exit is allowed for Egg Notes after the first month with 3 days’ notice. Chicken Notes lock until harvest, though you can sell units on our peer-to-peer exchange (coming soon).",
  },

  // PLATFORM & SUPPORT
  {
    id: "17",
    category: "Platform & Support",
    question: "What devices can I use?",
    answer:
      "The platform works on any modern browser and we have native iOS/Android apps planned. Bookmark or install our PWA for an app-like experience.",
  },
  {
    id: "18",
    category: "Platform & Support",
    question: "How do I contact support?",
    answer:
      "Visit the Support page or email help@poultryinvest.africa. Our team responds within 24 hours (often faster during business hours).",
  },
];

function filterFaqs(faqs: any[], term: string) {
  if (!term.trim()) return faqs;
  return faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(term.toLowerCase()) ||
      f.answer.toLowerCase().includes(term.toLowerCase())
  );
}

export default function FAQ() {
  const [search, setSearch] = useState("");
  const filtered = filterFaqs(seedFaqs, search);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-slate-600 text-lg">
          Answers to common questions about investing, returns, and platform
          safety.
        </p>
      </header>

      <div className="mb-8">
        <input
          type="text"
          value={search}
          placeholder="Search (e.g. payout, ROI, chicken)..."
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {!filtered.length && (
        <p className="text-slate-600">
          No FAQs match your search. Try different keywords or{" "}
          <a href="/contact" className="underline text-brand-700">
            contact support
          </a>
          .
        </p>
      )}

      <section className="space-y-4">
        {filtered.map((f) => (
          <details
            key={f.id}
            className="group border rounded-lg px-4 py-3 shadow-sm bg-white open:shadow-md transition"
          >
            <summary className="font-semibold text-brand-700 cursor-pointer flex justify-between items-center">
              <span>{f.question}</span>
              <span className="transition-transform group-open:rotate-90 text-slate-400">
                ▶
              </span>
            </summary>
            <div className="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">
              {f.answer}
            </div>
          </details>
        ))}
      </section>

      <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
        <h2 className="text-lg font-bold mb-2">Still need help?</h2>
        <p className="text-slate-600 mb-4">
          Contact our support team anytime — we’re happy to guide you through
          onboarding and your first investment.
        </p>
        <a
          href="/contact"
          className="inline-block btn btn-primary px-6 py-2 rounded-lg font-semibold"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
