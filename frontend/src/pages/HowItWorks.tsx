import { useEffect, useState, useMemo } from 'react'
import api from '../api/client'
import ReactMarkdown from 'react-markdown'

export default function HowItWorks() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ batches_egg: 0, batches_chicken: 0 })
  // calculator state
  const [productType, setProductType] = useState('CHICKEN') // 'CHICKEN' or 'EGG'
  const [units, setUnits] = useState(10)
  const [unitPrice, setUnitPrice] = useState(50)
  const [expectedRoi, setExpectedRoi] = useState(0.12)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [p, ov] = await Promise.all([
          api.get('/public/pages/how-it-works').catch(() => ({ data: null })),
          api.get('/public/overview').catch(() => ({ data: null })),
        ])
        if (!mounted) return
        setPage(p?.data || null)
        setStats(ov?.data?.stats || { batches_egg: 0, batches_chicken: 0 })
        // If page has ROI example or unit price, try to set them as defaults
        if (p?.data?.example_unit_price) setUnitPrice(p.data.example_unit_price)
        if (p?.data?.example_expected_roi) setExpectedRoi(p.data.example_expected_roi)
      } catch (e) {
        if (!mounted) return
        setError('Failed to load page content. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Update document title & meta description (simple)
  useEffect(() => {
    document.title = `${page?.title || 'How It Works'} | PoultryYield`
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', 'Learn how PoultryYield works — step by step, with product details, risk controls, and FAQ.')
    else {
      const m = document.createElement('meta')
      m.name = 'description'
      m.content = 'Learn how PoultryYield works — step by step, with product details, risk controls, and FAQ.'
      document.head.appendChild(m)
    }
  }, [page])

  // Simple investment calculator — estimates returns
  const calc = useMemo(() => {
    const principal = units * unitPrice
    // For chicken (one-off per cycle) we assume expectedRoi is per cycle.
    // For eggs (monthly), we assume expectedRoi is monthly and multiply for a 12-month view (illustrative).
    let estimatedReturn = 0
    if (productType === 'CHICKEN') {
      estimatedReturn = principal * expectedRoi // per cycle net return
    } else {
      // show 12-monthized illustrative return (not guaranteed)
      estimatedReturn = principal * expectedRoi * 12
    }
    const total = principal + estimatedReturn
    return { principal, estimatedReturn, total }
  }, [productType, units, unitPrice, expectedRoi])

  const markdownFallback = `
# How It Works

Welcome to PoultryYield — we connect everyday investors to vetted poultry farms through two core products:

- **Egg Note (Layers):** Monthly payouts once hens are in lay.
- **Chicken Note (Broilers):** Short cycles (~7–8 weeks) with lump-sum payouts at harvest.

This page explains the process step-by-step, how you earn, and the principal risks and safeguards we use to protect your capital.
  `.trim()

  // FAQ (local fallback if API doesn't provide)
  const faqFallback = [
    { q: 'How do I fund my wallet?', a: 'Go to your wallet page, follow deposit instructions — we currently simulate deposits in demo mode. Production supports mobile money/bank integrations.' },
    { q: 'When do I receive returns?', a: 'Broilers: at harvest (~7–8 weeks). Layers: monthly during productive lay period.' },
    { q: 'Is my capital guaranteed?', a: 'No — returns depend on farm performance and market prices. We mitigate risks with SOPs, insurance, and reserves.' },
    { q: 'Can I exit early?', a: 'Some early-exit options exist via an internal transfer board; fees and discounts may apply.' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* HERO */}
      <section className="grid md:grid-cols-2 gap-8 items-center mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">How PoultryYield Works</h1>
          <p className="mt-4 text-lg text-slate-700">
            Invest in real poultry farms (Egg Note & Chicken Note), track live batches, and receive automated payouts to your wallet.
            We provide transparent reporting, vetted farms, and clear controls so you know where your money is working.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="/register" className="inline-block btn btn-primary">Create account</a>
            <a href="#calculator" className="inline-block btn btn-outline">Estimate returns</a>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold">{stats.batches_chicken ?? 0}</div>
              <div className="text-xs text-slate-500">Broiler batches</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold">{stats.batches_egg ?? 0}</div>
              <div className="text-xs text-slate-500">Layer batches</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-slate-500">Live tracking</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-xl">Quick Product Comparison</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-semibold">Egg Note (Layers)</div>
              <ul className="mt-2 text-sm text-slate-600 space-y-1">
                <li>Tenor: ~17 months (rearing + production)</li>
                <li>Payouts: monthly from egg sales</li>
                <li>Liquidity: limited; internal transfer board may allow secondary sales</li>
                <li>Risk drivers: feed cost, egg price, mortality</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold">Chicken Note (Broilers)</div>
              <ul className="mt-2 text-sm text-slate-600 space-y-1">
                <li>Cycle: ~7–8 weeks</li>
                <li>Payouts: lump-sum at harvest</li>
                <li>Ideal for: short-cycle investors & compounding</li>
                <li>Risk drivers: feed price, sale price, FCR, mortality</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Note: All numbers are illustrative. Review batch details before investing.
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="grid lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Step-by-step Process</h2>
              <div className="text-sm text-slate-500">Transparent, repeatable</div>
            </div>

            <ol className="mt-4 space-y-6">
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">1</div>
                <div>
                  <div className="font-semibold">Sign up & verify</div>
                  <div className="text-sm text-slate-600">Create an account, complete KYC (ID & selfie), and secure your profile.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">2</div>
                <div>
                  <div className="font-semibold">Fund your wallet</div>
                  <div className="text-sm text-slate-600">Deposit funds via mobile money or bank transfer. (Demo mode simulates deposits.)</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">3</div>
                <div>
                  <div className="font-semibold">Select a batch</div>
                  <div className="text-sm text-slate-600">Browse live batches with unit price, expected ROI, and farm details. Choose eggs or chicken based on your preference.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">4</div>
                <div>
                  <div className="font-semibold">Invest</div>
                  <div className="text-sm text-slate-600">Buy the number of units you want. The platform holds funds in escrow until deployment to the farm.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">5</div>
                <div>
                  <div className="font-semibold">Track progress</div>
                  <div className="text-sm text-slate-600">View daily logs, photos, lay rate (for layers), FCR & weights (for broilers), and mortality reports.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">6</div>
                <div>
                  <div className="font-semibold">Receive payouts</div>
                  <div className="text-sm text-slate-600">Broilers: payout at harvest. Layers: monthly distributions. Funds go to your platform wallet.</div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-none w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold">7</div>
                <div>
                  <div className="font-semibold">Withdraw or reinvest</div>
                  <div className="text-sm text-slate-600">Transfer to bank/MoMo or auto-reinvest into the next batch for compounding.</div>
                </div>
              </li>
            </ol>
          </div>

          {/* Transparency / Metrics */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg">What you see on each batch</h3>
            <ul className="mt-3 text-sm text-slate-600 space-y-2">
              <li><strong>Unit price:</strong> cost per unit you buy (GHS).</li>
              <li><strong>Expected ROI:</strong> projected return (illustrative) — actual depends on market & performance.</li>
              <li><strong>FCR / Lay rate:</strong> feed-conversion ratio and eggs-per-hen metrics for farm performance.</li>
              <li><strong>Mortality & incident logs:</strong> daily reporting and vet interventions recorded for transparency.</li>
            </ul>
          </div>

          {/* Security & Risk */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg">Security & Risk Management</h3>
            <div className="mt-3 text-sm text-slate-600 space-y-2">
              <p>We do not guarantee capital. The main risks include disease outbreaks, feed price shocks, and market prices. Here are our mitigation measures:</p>
              <ul className="list-disc ml-6">
                <li>Vetted farms with SOPs and regular audits.</li>
                <li>Mandatory vaccination & vet partnerships.</li>
                <li>Ring-fenced funds & escrow until disbursement.</li>
                <li>Operating reserves to smooth payouts in weak months.</li>
                <li>Insurance/parametric covers where available.</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">See full risk disclosure in the Terms & Conditions before investing.</p>
            </div>
          </div>

          {/* CMS content or fallback markdown */}
          <div className="card p-6 mb-6">
            <h3 className="font-bold text-lg">Detailed Guide</h3>
            <div className="mt-3 text-slate-700 prose max-w-none">
              {loading && <div className="text-slate-500">Loading detailed guide…</div>}
              {!loading && error && <div className="text-red-600">{error}</div>}
              {!loading && !error && page?.body_md && (
                <ReactMarkdown>{page.body_md}</ReactMarkdown>
              )}
              {!loading && !error && !page?.body_md && (
                <ReactMarkdown>{markdownFallback}</ReactMarkdown>
              )}
            </div>
          </div>
        </article>

        {/* RIGHT SIDEBAR: calculator + FAQ */}
        <aside className="space-y-6">
          {/* Calculator */}
          <div id="calculator" className="card p-6">
            <h3 className="font-bold text-lg">Estimate Returns</h3>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="text-xs text-slate-600">Product</span>
                <select value={productType} onChange={e => setProductType(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="CHICKEN">Chicken Note (broiler)</option>
                  <option value="EGG">Egg Note (layer)</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Units</span>
                <input type="number" min={1} value={units} onChange={e => setUnits(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Unit price (GHS)</span>
                <input type="number" min={1} value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>

              <label className="block">
                <span className="text-xs text-slate-600">Expected ROI (decimal)</span>
                <input type="number" step="0.01" min={0} value={expectedRoi} onChange={e => setExpectedRoi(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>

              <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-slate-500">Principal</div>
                <div className="font-bold text-lg">GHS {calc.principal.toFixed(2)}</div>

                <div className="mt-2 text-xs text-slate-500">Estimated return ({productType === 'CHICKEN' ? 'per cycle' : '12-month illustrative'})</div>
                <div className="font-semibold">GHS {calc.estimatedReturn.toFixed(2)}</div>

                <div className="mt-2 text-xs text-slate-500">Total (principal + estimated)</div>
                <div className="font-semibold">GHS {calc.total.toFixed(2)}</div>
              </div>

              <div className="mt-3">
                <a href="/register" className="btn btn-primary w-full">Create account & invest</a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="card p-6">
            <h3 className="font-bold text-lg">Frequently Asked Questions</h3>
            <div className="mt-3 space-y-2">
              {(page?.faqs || faqFallback).map((f, i) => (
                <details key={i} className="border rounded-lg p-2">
                  <summary className="cursor-pointer font-semibold">{f.question || f.q}</summary>
                  <div className="mt-2 text-sm text-slate-600">{f.answer || f.a}</div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA / contact */}
          <div className="card p-6 text-center">
            <h4 className="font-bold">Need help?</h4>
            <p className="text-sm text-slate-600 mt-2">Contact our support team or join the monthly investor webinar for Q&A and farm tours.</p>
            <div className="mt-4">
              <a href="/contact" className="btn btn-outline w-full">Contact support</a>
              <a href="/faq" className="btn btn-primary w-full mt-3">View full FAQ</a>
            </div>
          </div>
        </aside>
      </section>

      <style>{`
        /* small stylistic helper for prose content inside Tailwind */
        .prose p { margin-bottom: 0.75rem; }
      `}</style>
    </div>
  )
}
