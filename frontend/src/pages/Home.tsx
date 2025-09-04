import { Link } from 'react-router-dom'
import api from '../api/client'
import { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

export default function Home() {
  const [stats, setStats] = useState<{ batches_chicken?: number; batches_egg?: number }>({})
  const [products, setProducts] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculator state
  const [calcProduct, setCalcProduct] = useState<'CHICKEN' | 'EGG'>('CHICKEN')
  const [calcUnits, setCalcUnits] = useState<number>(10)
  const [calcUnitPrice, setCalcUnitPrice] = useState<number>(50)
  const [calcROI, setCalcROI] = useState<number>(0.12) // decimal (12%)

  useEffect(() => {
    document.title = 'PoultryYield — Invest in Poultry'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', 'Invest in poultry farms: Egg Note (layers) and Chicken Note (broilers). Track batches, get payouts, and reinvest.')
    else {
      const m = document.createElement('meta')
      m.name = 'description'
      m.content = 'Invest in poultry farms: Egg Note (layers) and Chicken Note (broilers). Track batches, get payouts, and reinvest.'
      document.head.appendChild(m)
    }

    let mounted = true
    setLoadingStats(true)
    setError(null)
    api.get('/public/overview')
      .then(r => { if (mounted) setStats(r.data.stats || {}) })
      .catch(() => { if (mounted) setError('Could not load platform stats') })
      .finally(() => { if (mounted) setLoadingStats(false) })

    api.get('/public/products')
      .then(r => { if (mounted) setProducts(r.data || []) })
      .catch(() => { /* ignore - fallback handled */ })
      .finally(() => { if (mounted) setLoadingProducts(false) })

    return () => { mounted = false }
  }, [])

  // Animated counter helper (simple)
  function Counter({ value, format } : { value?: number, format?: (n:number)=>string }) {
    // small no-dep counter: just show value or 0
    const display = value ?? 0
    return <div className="text-2xl md:text-3xl font-bold">{format ? format(display) : display}</div>
  }

  // Small sample performance series (for sparkline)
  const sparkData = useMemo(() => {
    // map recent product amounts for chart; fallback to sample
    if (products && products.length) {
      return products.slice(0, 8).map((p: any, i: number) => ({ name: `B${p.id}`, val: p.expected_roi ? Math.round(p.expected_roi * 100) : (10 + i) }))
    }
    return [
      { name: 'W1', val: 8 },
      { name: 'W2', val: 12 },
      { name: 'W3', val: 9 },
      { name: 'W4', val: 14 },
      { name: 'W5', val: 11 },
      { name: 'W6', val: 13 },
      { name: 'W7', val: 15 },
      { name: 'W8', val: 12 },
    ]
  }, [products])

  // Calculator memo
  const calc = useMemo(() => {
    const principal = calcUnits * calcUnitPrice
    let estimatedReturn = 0
    if (calcProduct === 'CHICKEN') {
      estimatedReturn = principal * calcROI // ROI per cycle
    } else {
      // illustrative: assume ROI is monthly -> show 12-monthized return
      estimatedReturn = principal * calcROI * 12
    }
    const total = principal + estimatedReturn
    return { principal, estimatedReturn, total }
  }, [calcProduct, calcUnits, calcUnitPrice, calcROI])

  // Product cards - prefer explicit Egg/Chicken items or fallback
  const eggCard = useMemo(() => {
    const p = products.find(p => p.product_type === 'EGG') || {}
    return {
      title: 'Egg Note (Layers)',
      subtitle: 'Monthly income once hens are in lay',
      unitPrice: p.unit_price ?? 150,
      expectedROI: p.expected_roi ?? 0.03, // monthly
      tenor: '≈ 17 months (2m rearing + 15m lay)',
      bullets: [
        'Monthly distributions from egg sales',
        'End-of-cycle salvage value included',
        'Suitable for yield-seeking investors',
      ],
    }
  }, [products])

  const chickenCard = useMemo(() => {
    const p = products.find(p => p.product_type === 'CHICKEN') || {}
    return {
      title: 'Chicken Note (Broilers)',
      subtitle: 'Short cycles (~7–8 weeks) with lump-sum payout',
      unitPrice: p.unit_price ?? 50,
      expectedROI: p.expected_roi ?? 0.18, // per cycle
      tenor: '7–8 week cycles',
      bullets: [
        'Fast compounding via short cycles',
        'Payout at harvest, optional auto-reinvest',
        'Higher velocity returns, higher sensitivity to market prices',
      ],
    }
  }, [products])

  return (
    <div className="bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Invest in Poultry.<br /><span className="text-brand-600">Earn Real-World Yield.</span></h1>
              <p className="mt-4 text-lg text-slate-700">Choose <strong>Egg Note</strong> for steady monthly income or <strong>Chicken Note</strong> for fast 7–8 week cycles. Track live batches, review farm metrics, and reinvest in one tap.</p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="btn btn-primary">Get started</Link>
                <Link to="/how-it-works" className="btn btn-outline">How it works</Link>
                <Link to="/portfolio" className="btn btn-accent">Go to Dashboard</Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="card p-4">
                  <Counter value={loadingStats ? undefined : stats?.batches_chicken} />
                  <div className="text-xs text-slate-500">Chicken batches</div>
                </div>
                <div className="card p-4">
                  <Counter value={loadingStats ? undefined : stats?.batches_egg} />
                  <div className="text-xs text-slate-500">Egg batches</div>
                </div>
                <div className="card p-4">
                  <div className="text-2xl md:text-3xl font-bold">24/7</div>
                  <div className="text-xs text-slate-500">Live tracking</div>
                </div>
              </div>
            </div>

            <div className="card p-6 shadow-lg">
              <h3 className="font-bold text-xl">How you profit</h3>
              <ol className="mt-4 space-y-3 text-slate-700 list-decimal list-inside">
                <li>Create an account & complete KYC.</li>
                <li>Fund your wallet and pick a live batch.</li>
                <li>Buy units (eggs: hens; chicken: broiler units).</li>
                <li>Track performance metrics (lay rate, FCR, weights).</li>
                <li>Receive payouts (monthly for eggs; harvest for chicken).</li>
                <li>Withdraw or auto-reinvest to compound.</li>
              </ol>
              <p className="mt-4 text-sm text-slate-500">Capital at risk. Returns depend on farm performance and market prices.</p>

              <div className="mt-4">
                <Link to="/invest/chicken" className="btn btn-primary w-full">Invest in Chicken</Link>
                <Link to="/invest/eggs" className="btn btn-outline w-full mt-2">Invest in Eggs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / TRUST */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="font-semibold">Vetted farms</div>
            <p className="text-sm mt-2 text-slate-600">We only partner with farms that meet SOPs, biosecurity, and reporting standards.</p>
          </div>
          <div className="card p-6">
            <div className="font-semibold">Transparent reporting</div>
            <p className="text-sm mt-2 text-slate-600">Daily logs, photos, lay rate and FCR visible on every batch dashboard.</p>
          </div>
          <div className="card p-6">
            <div className="font-semibold">Secure payouts</div>
            <p className="text-sm mt-2 text-slate-600">Funds are escrowed, and payouts are automated to your wallet after verification.</p>
          </div>
        </div>
      </section>

      {/* PRODUCT CARDS + SPARKLINE */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">Product</div>
                <h3 className="text-2xl font-bold mt-1">{chickenCard.title}</h3>
                <div className="text-sm text-slate-600 mt-1">{chickenCard.subtitle}</div>
                <div className="mt-4 text-sm text-slate-600 space-y-1">
                  <div><strong>Unit price:</strong> GHS {chickenCard.unitPrice}</div>
                  <div><strong>Expected ROI (per cycle):</strong> {(chickenCard.expectedROI * 100).toFixed(1)}%</div>
                  <div><strong>Cycle:</strong> {chickenCard.tenor}</div>
                </div>
                <ul className="mt-4 text-sm text-slate-600 list-disc ml-5">
                  {chickenCard.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>

                <div className="mt-4 flex gap-3">
                  <Link to="/invest/chicken" className="btn btn-primary">Invest</Link>
                  <Link to="/how-it-works" className="btn btn-outline">Learn more</Link>
                </div>
              </div>

              <div className="w-40 h-28 ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="val" stroke="#C68600" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">Product</div>
                <h3 className="text-2xl font-bold mt-1">{eggCard.title}</h3>
                <div className="text-sm text-slate-600 mt-1">{eggCard.subtitle}</div>
                <div className="mt-4 text-sm text-slate-600 space-y-1">
                  <div><strong>Unit price:</strong> GHS {eggCard.unitPrice}</div>
                  <div><strong>Expected monthly ROI:</strong> {(eggCard.expectedROI * 100).toFixed(1)}%</div>
                  <div><strong>Tenor:</strong> {eggCard.tenor}</div>
                </div>
                <ul className="mt-4 text-sm text-slate-600 list-disc ml-5">
                  {eggCard.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>

                <div className="mt-4 flex gap-3">
                  <Link to="/invest/eggs" className="btn btn-primary">Invest</Link>
                  <Link to="/how-it-works" className="btn btn-outline">Learn more</Link>
                </div>
              </div>

              <div className="w-40 h-28 ml-4">
                <div className="text-xs text-slate-500">Recent batch ROI</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="val" stroke="#6B5B00" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE BATCHES PREVIEW + CALCULATOR SIDEBAR */}
      <section className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Live batches</h2>
            <Link to="/invest/chicken" className="text-sm text-brand-700 underline">View all products</Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {loadingProducts && (
              <div className="col-span-2 text-slate-500">Loading batches…</div>
            )}

            {!loadingProducts && products.length === 0 && (
              <div className="col-span-2 text-slate-600">No active batches available right now — check back soon.</div>
            )}

            {!loadingProducts && products.slice(0, 6).map((b: any) => (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{b.product_type} • Batch #{b.id}</div>
                    <div className="font-semibold mt-1">Unit: GHS {b.unit_price?.toFixed(2) ?? '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">Placed: {b.units_placed}/{b.target_units}</div>
                    <div className="text-xs text-slate-500 mt-1">Status: {b.status}</div>
                  </div>
                  <div>
                    <Link to={`/invest/${b.product_type === 'EGG' ? 'eggs' : 'chicken'}`} className="btn btn-outline">Invest</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculator / Quick CTA */}
        <aside>
          <div className="card p-6 sticky top-6">
            <h3 className="font-bold text-lg">Quick estimator</h3>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="text-xs text-slate-600">Product</span>
                <select value={calcProduct} onChange={e => setCalcProduct(e.target.value as any)} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="CHICKEN">Chicken Note</option>
                  <option value="EGG">Egg Note</option>
                </select>
              </label>

              <label>
                <span className="text-xs text-slate-600">Units</span>
                <input type="number" min={1} value={calcUnits} onChange={e => setCalcUnits(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>

              <label>
                <span className="text-xs text-slate-600">Unit price (GHS)</span>
                <input type="number" min={1} value={calcUnitPrice} onChange={e => setCalcUnitPrice(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </label>

              <label>
                <span className="text-xs text-slate-600">Expected ROI (decimal)</span>
                <input type="number" step="0.01" min={0} value={calcROI} onChange={e => setCalcROI(Number(e.target.value || 0))} className="mt-1 w-full border rounded-lg px-3 py-2" />
                <div className="text-xs text-slate-500 mt-1">For chicken, ROI is per cycle. For eggs, ROI is monthly (illustrative).</div>
              </label>

              <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-slate-500">Principal</div>
                <div className="font-bold text-lg">GHS {calc.principal.toFixed(2)}</div>
                <div className="text-xs text-slate-500 mt-2">Est. return ({calcProduct === 'CHICKEN' ? 'per cycle' : '12-month illustrative'})</div>
                <div className="font-semibold">GHS {calc.estimatedReturn.toFixed(2)}</div>
                <div className="text-xs text-slate-500 mt-2">Total</div>
                <div className="font-semibold">GHS {calc.total.toFixed(2)}</div>
              </div>

              <div>
                <Link to="/register" className="btn btn-primary w-full">Create account & invest</Link>
              </div>
            </div>
          </div>

          <div className="card p-4 mt-4">
            <div className="font-semibold">Trusted by investors</div>
            <div className="mt-3 text-sm text-slate-600">We publish regular batch performance and audit summaries to give you full visibility into your capital at work.</div>
          </div>
        </aside>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Investor stories</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <blockquote className="card p-6">
            <div className="text-slate-700">“Quick cycles and clear reporting — I can see exactly how my broiler batches are performing.”</div>
            <div className="mt-4 font-semibold">— Ama, Accra</div>
          </blockquote>
          <blockquote className="card p-6">
            <div className="text-slate-700">“I like the steady monthly income from the Egg Note — great diversification from my usual investments.”</div>
            <div className="mt-4 font-semibold">— Kofi, Kumasi</div>
          </blockquote>
          <blockquote className="card p-6">
            <div className="text-slate-700">“Support responded quickly during a minor batch incident and we received a full incident report.”</div>
            <div className="mt-4 font-semibold">— Ritha, Takoradi</div>
          </blockquote>
        </div>
      </section>

      {/* FAQ Preview + CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold">Got questions?</h3>
            <p className="mt-2 text-slate-600">Read our full FAQ or join the investor webinar for a live farm tour and Q&A.</p>
            <div className="mt-4 flex gap-3">
              <Link to="/faq" className="btn btn-outline">Read FAQ</Link>
              <a href="/how-it-works" className="btn btn-primary">How it works</a>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm text-slate-600">FAQ Preview</div>
            <ul className="mt-3 list-disc ml-5 text-sm space-y-2 text-slate-700">
              <li><strong>How do I fund my wallet?</strong> - Use the wallet page; we support mobile money and bank transfer in production.</li>
              <li><strong>When are payouts made?</strong> - Broilers: at harvest. Layers: monthly once in lay.</li>
              <li><strong>Is capital guaranteed?</strong> - No. We mitigate risk via SOPs, reserves, and insurance where possible.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h3 className="text-2xl font-bold">Ready to start?</h3>
          <p className="mt-2 text-slate-600">Create an account, fund your wallet, and choose your first batch.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/register" className="btn btn-primary">Create account</Link>
            <Link to="/invest/chicken" className="btn btn-outline">Explore batches</Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
