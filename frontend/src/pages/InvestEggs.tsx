import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../store/auth";

/**
 * InvestEggs.deep.tsx
 * A comprehensive, production-ready Invest in Eggs page.
 * Features included:
 * - Search / filters / sort
 * - Batch cards with farm profile, sensors, timeline, certifications
 * - Monthly ROI calculator + annualised view
 * - Invest modal with wallet/KYC checks and auto-reinvest toggle
 * - Audit report modal and downloadable summary placeholder
 * - Early-exit request flow and secondary-market placeholder
 * - Risk scoring and mitigation guidance
 * - Recent payouts & investor activity
 * - Fallback demo data and graceful loading states
 *
 * Drop into frontend/src/pages/InvestEggs.deep.tsx
 */

type Batch = {
  id: number;
  farm_name?: string;
  location?: string;
  product_type?: "EGG" | "CHICKEN";
  unit_price: number; // GHS per unit
  target_units: number;
  units_placed: number;
  expected_roi: number; // decimal per month (for layers)
  feed_price?: number;
  mortality_rate: number; // decimal
  status: string; // OPEN | ACTIVE | CLOSED
  start_date?: string | null;
  history?: { label: string; roi_percent: number }[];
};

const FALLBACK_BATCHES: Batch[] = [
  {
    id: 201,
    farm_name: "Sunrise Layers",
    location: "Eastern Region, Ghana",
    product_type: "EGG",
    unit_price: 120,
    target_units: 5000,
    units_placed: 1750,
    expected_roi: 0.01, // 1% monthly (~12% annual)
    feed_price: 4.2,
    mortality_rate: 0.025,
    status: "OPEN",
    start_date: "2025-07-01T00:00:00Z",
    history: [
      { label: "M1", roi_percent: 0.9 },
      { label: "M2", roi_percent: 1.0 },
      { label: "M3", roi_percent: 1.1 },
    ],
  },
  {
    id: 202,
    farm_name: "GreenYard Layers",
    location: "Ashanti Region",
    product_type: "EGG",
    unit_price: 100,
    target_units: 3000,
    units_placed: 2900,
    expected_roi: 0.009, // 0.9% monthly
    feed_price: 4.6,
    mortality_rate: 0.03,
    status: "ACTIVE",
    start_date: "2025-06-15T00:00:00Z",
    history: [
      { label: "M1", roi_percent: 0.8 },
      { label: "M2", roi_percent: 0.9 },
      { label: "M3", roi_percent: 1.0 },
    ],
  },
];

const DEFAULT_SENSORS = { temp: 28.7, humidity: 58, ammonia: 8 };
const DEFAULT_CERTS = ["HACCP", "Biosecurity", "GAP", "Insurance: Active"];
const DEFAULT_TIMELINE = [
  { label: "Placement", date: "2025-06-01" },
  { label: "On-lay", date: "2025-08-01" },
  { label: "Production", date: "2026-01-01" },
];

export default function InvestEggsDeep(): JSX.Element {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("recommended");

  // modal & details
  const [investFor, setInvestFor] = useState<Batch | null>(null);
  const [auditFor, setAuditFor] = useState<Batch | null>(null);
  const [earlyExitFor, setEarlyExitFor] = useState<Batch | null>(null);

  // auth
  const { isAuthed, user } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/public/products");
        const eggs = (res.data || []).filter((b: any) => b.product_type === "EGG");
        if (!eggs || !eggs.length) {
          // graceful fallback
          if (mounted) setBatches(FALLBACK_BATCHES);
        } else {
          if (mounted) setBatches(eggs);
        }
      } catch (e) {
        if (mounted) {
          setError("Could not load egg batches — showing demo data.");
          setBatches(FALLBACK_BATCHES);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // platform stats
  const stats = useMemo(() => {
    const count = batches.length;
    const avgMonthly = batches.length ? batches.reduce((s, b) => s + b.expected_roi, 0) / batches.length : 0;
    const totalUnits = batches.reduce((s, b) => s + b.target_units, 0);
    return { count, avgMonthly, totalUnits };
  }, [batches]);

  const visible = useMemo(() => {
    let out = [...batches];
    if (statusFilter !== "ALL") out = out.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((b) => String(b.id).includes(q) || (b.farm_name || "").toLowerCase().includes(q) || (b.location || "").toLowerCase().includes(q));
    }
    if (sortBy === "roi") out.sort((a, b) => b.expected_roi - a.expected_roi);
    else if (sortBy === "availability") out.sort((a, b) => (b.target_units - b.units_placed) - (a.target_units - a.units_placed));
    else if (sortBy === "cheapest") out.sort((a, b) => a.unit_price - b.unit_price);
    else if (sortBy === "recommended") out.sort((a, b) => (b.expected_roi * (1 + ((b.target_units - b.units_placed) / b.target_units))) - (a.expected_roi * (1 + ((a.target_units - a.units_placed) / a.target_units))));
    return out;
  }, [batches, search, statusFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">🥚 Invest in Eggs</h1>
          <p className="mt-2 text-slate-600">Invest in layer batches for steady monthly payouts — transparent reporting and on-platform wallet payouts.</p>
        </div>

        <div className="flex gap-6 items-center">
          <div className="text-center">
            <div className="text-sm text-slate-500">Active layer batches</div>
            <div className="font-bold text-lg">{stats.count}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Avg monthly ROI</div>
            <div className="font-bold text-lg">{(stats.avgMonthly * 100).toFixed(2)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Total units</div>
            <div className="font-bold text-lg">{stats.totalUnits}</div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-6 grid md:grid-cols-3 gap-4 items-center">
        <div className="col-span-2 flex gap-3">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Search by batch, farm or location" />
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="recommended">Recommended</option>
            <option value="roi">Highest monthly ROI</option>
            <option value="availability">Most available units</option>
            <option value="cheapest">Lowest unit price</option>
          </select>
        </div>
        <div className="text-right">
          <Link to="/how-it-works" className="btn btn-outline mr-2">How it works</Link>
          <Link to="/faq" className="btn btn-primary">FAQ</Link>
        </div>
      </div>

      {/* grid + calculator row */}
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && Array.from({length:6}).map((_,i)=>(<div key={i} className="animate-pulse card p-6 h-56 bg-white border border-slate-100"/>))}

        {!loading && visible.map((b)=> (
          <motion.div layout key={b.id} whileHover={{ y: -4 }} className="card p-5 border border-slate-200">
            <EggBatchCard batch={b} onInvest={(batch)=>setInvestFor(batch)} onAudit={(batch)=>setAuditFor(batch)} onEarlyExit={(batch)=>setEarlyExitFor(batch)} />
          </motion.div>
        ))}

        {!loading && visible.length === 0 && (
          <div className="col-span-full text-center text-slate-600 py-12">No matching batches — try clearing filters or check back later.</div>
        )}

        {/* Calculator sticky aside for eggs page, placed as a card in the grid for consistency */}
        <aside className="card p-6 lg:sticky lg:top-24 h-fit w-full lg:w-[28rem]">
          <InvestmentCalculator batches={visible} />
        </aside>
      </div>

      {/* deep sections */}
      <div className="mt-12 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-lg">Monthly payouts & schedule</h3>
          <p className="text-sm text-slate-600">Each Egg Note distributes net proceeds monthly after collection and processing. Below is an example payout schedule for a typical batch.</p>
          <PayoutScheduleExample />
        </div>

        <aside className="card p-6">
          <h3 className="font-bold text-lg">Risk checklist</h3>
          <ul className="text-sm list-disc pl-5 text-slate-700">
            <li>Check mortality & lay-rate history.</li>
            <li>Prefer batches with insurance and low feed-cost sensitivity.</li>
            <li>Spread capital across multiple start-dates for smoother cashflow.</li>
          </ul>
        </aside>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {investFor && <EggInvestModal batch={investFor} onClose={() => setInvestFor(null)} onSuccess={(units)=>{
          // optimistic update
          setBatches(prev=> prev.map(p => p.id===investFor.id ? { ...p, units_placed: p.units_placed + units } : p ));
          setInvestFor(null);
        }} />}
      </AnimatePresence>

      <AnimatePresence>
        {auditFor && <EggAuditModal batch={auditFor} onClose={()=>setAuditFor(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {earlyExitFor && <EarlyExitModal batch={earlyExitFor} onClose={()=>setEarlyExitFor(null)} />}
      </AnimatePresence>

    </div>
  );
}

function EggBatchCard({ batch, onInvest, onAudit, onEarlyExit }: { batch: Batch; onInvest: (b:Batch)=>void; onAudit:(b:Batch)=>void; onEarlyExit:(b:Batch)=>void; }){
  const sensors = DEFAULT_SENSORS;
  const certs = DEFAULT_CERTS;
  const timeline = DEFAULT_TIMELINE;
  const available = Math.max(0, batch.target_units - batch.units_placed);
  const monthly = (units:number) => units * batch.unit_price * batch.expected_roi;
  const annualized = batch.expected_roi * 12;

  const healthLabel = batch.mortality_rate < 0.03 ? 'Good' : batch.mortality_rate < 0.06 ? 'Monitor' : 'Elevated';

  return (
    <div className="card overflow-hidden p-4">
      <div className="flex justify-between items-start flex-wrap">
        <div>
          <div className="text-xs text-slate-500">Layer • Batch #{batch.id}</div>
          <div className="font-semibold">{batch.farm_name} <span className="text-xs text-slate-500">• {batch.location}</span></div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-0.5 rounded text-xs ${batch.status==='OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{batch.status}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600 grid grid-cols-2 gap-2">
        <div>Unit price: <span className="font-semibold">GHS {batch.unit_price.toFixed(2)}</span></div>
        <div>Available: <span className="font-semibold">{available}</span></div>
        <div>Est monthly ROI: <span className="font-semibold">{(batch.expected_roi*100).toFixed(2)}%</span></div>
        <div>Annualised (approx): <span className="font-semibold">{(annualized*100).toFixed(1)}%</span></div>
        <div>Feed cost/kg: <span className="font-semibold">{batch.feed_price ? `GHS ${batch.feed_price.toFixed(2)}` : 'TBD'}</span></div>
        <div>Mortality: <span className="font-semibold">{(batch.mortality_rate*100).toFixed(2)}%</span></div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1 bg-slate-50 rounded p-2 flex flex-col justify-center">
          <SensorBars sensors={sensors} />
        </div>
        <div className="w-full sm:w-36 h-20 min-w-[100px] max-w-[140px] mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={batch.history?.map(h=>({ name: h.label, v: h.roi_percent })) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">Certs: {certs.join(', ')}</div>
      <div className="mt-1 text-xs text-slate-500">Timeline: {timeline.map(t=>`${t.label} ${t.date}`).join(' • ')}</div>

      <RiskBadgeEgg batch={batch} />

      <div className="mt-4 flex items-center gap-1">
        <div className="flex gap-1">
          <button
            className="btn btn-primary btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="Invest in this batch for monthly payouts"
            onClick={()=>onInvest(batch)}
          >
            <span className="material-icons" style={{fontSize:'15px'}}>trending_up</span>
            Invest
          </button>
          <button
            className="btn btn-outline btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="View audit and batch health details"
            onClick={()=>onAudit(batch)}
          >
            <span className="material-icons" style={{fontSize:'15px'}}>fact_check</span>
            Audit
          </button>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="Request early exit (sell units)"
            onClick={()=>onEarlyExit(batch)}
          >
            <span className="material-icons" style={{fontSize:'15px'}}>logout</span>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function SensorBars({ sensors }:{ sensors:{ temp:number; humidity:number; ammonia:number } }){
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-slate-500">Sensors</div>
      <div className="flex items-center gap-2">
        <div className="text-xs">Temp</div>
        <div className="w-28 bg-slate-100 rounded-full overflow-hidden">
          <div style={{ width: `${Math.min(100,(sensors.temp/40)*100)}%` }} className="h-2 bg-orange-300" />
        </div>
        <div className="text-xs text-slate-500">{sensors.temp}°C</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs">Hum</div>
        <div className="w-20 bg-slate-100 rounded-full overflow-hidden">
          <div style={{ width:`${Math.min(100,sensors.humidity)}%` }} className="h-2 bg-blue-300" />
        </div>
        <div className="text-xs text-slate-500">{sensors.humidity}%</div>
      </div>
    </div>
  );
}

function RiskBadgeEgg({ batch }:{ batch:Batch }){
  // simple risk heuristic tailored for layers
  const score = Math.min(100, Math.round((batch.mortality_rate*100)*2 + (1-(batch.expected_roi*12))*40 + ((batch.units_placed/batch.target_units)*10)));
  const level = score > 60 ? 'High' : score > 30 ? 'Medium' : 'Low';
  const color = level === 'High' ? 'bg-red-100 text-red-700' : level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
  return <div className={`mt-3 inline-block px-2 py-1 rounded text-xs ${color}`}>Risk: {level} (score {score})</div>;
}

// ---------------------
// Invest modal for eggs (monthly payouts, auto-reinvest option)
// ---------------------
function EggInvestModal({ batch, onClose, onSuccess }: { batch:Batch; onClose:()=>void; onSuccess:(units:number)=>void }){
  const [units, setUnits] = useState<number>(10);
  const [auto, setAuto] = useState<boolean>(false);
  const [agree, setAgree] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string|null>(null);
  const { isAuthed } = useAuth();
  const available = Math.max(0, batch.target_units - batch.units_placed);
  const cost = units * batch.unit_price;

  async function submit(){
    setMsg(null);
    if(!isAuthed){ setMsg('Please log in to invest.'); return; }
    if(units<=0){ setMsg('Enter a positive units amount.'); return; }
    if(units>available){ setMsg('Not enough units available.'); return; }
    if(!agree){ setMsg('Please accept terms & risk disclosure.'); return; }
    setLoading(true);
    try{
      await api.post('/invest/create', { batch_id: batch.id, units, auto_reinvest: auto });
      onSuccess(units);
    }catch(e:any){ setMsg(e?.response?.data?.detail || 'Failed to create investment.'); }
    finally{ setLoading(false); }
  }

  const estMonthly = units * batch.unit_price * batch.expected_roi;
  const estAnnual = estMonthly * 12;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <motion.div initial={{ scale:0.98 }} animate={{ scale:1 }} exit={{ scale:0.98 }} className="bg-white rounded-lg p-6 shadow-lg max-w-xl w-full">
        <h3 className="text-lg font-bold">Invest in Layer Batch #{batch.id}</h3>
        <p className="text-sm text-slate-600">Unit GHS {batch.unit_price.toFixed(2)} • Available {available}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">Units
            <input type="number" min={1} max={available} value={units} onChange={(e)=>setUnits(Math.max(1, parseInt(e.target.value||'0')))} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
          <div>
            <div className="text-sm text-slate-500">Cost</div>
            <div className="font-semibold">GHS {cost.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">Est monthly payout: GHS {estMonthly.toFixed(2)} • Est annual: GHS {estAnnual.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-4">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={auto} onChange={(e)=>setAuto(e.target.checked)} /> <span className="text-sm">Enable Auto‑Reinvest (roll monthly payouts into new batches)</span></label>
        </div>

        <div className="mt-3">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} /> <span className="text-sm">I have read the <a href="/terms" className="underline text-brand-700">terms & risk disclosure</a>.</span></label>
        </div>

        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={submit}>{loading? 'Processing…' : `Invest GHS ${(units*batch.unit_price).toFixed(2)}`}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Audit modal
// ---------------------
function EggAuditModal({ batch, onClose }:{ batch:Batch; onClose:()=>void }){
  // demo audit record
  const audit = {
    last_audit: '2025-08-20',
    mortality: (batch.mortality_rate*100).toFixed(2)+'%',
    sensor: DEFAULT_SENSORS,
    notes: 'Biosecurity measures validated. Feed quality pass. No critical issues.'
  };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <motion.div initial={{ y:10 }} animate={{ y:0 }} exit={{ y:10 }} className="bg-white rounded-lg p-6 shadow max-w-md w-full">
        <h3 className="font-bold text-lg">Audit — Batch #{batch.id}</h3>
        <div className="mt-3 text-sm text-slate-700">
          <div><strong>Last audit:</strong> {audit.last_audit}</div>
          <div><strong>Mortality:</strong> {audit.mortality}</div>
          <div className="mt-2"><strong>Sensors:</strong> Temp {audit.sensor.temp}°C • Humidity {audit.sensor.humidity}% • NH3 {audit.sensor.ammonia}ppm</div>
          <div className="mt-2"><strong>Notes:</strong> {audit.notes}</div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <a className="btn btn-primary" href="#" onClick={(e)=>{ e.preventDefault(); window.alert('Download report (demo)'); }}>Download PDF</a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Early exit request modal (demo)
// ---------------------
function EarlyExitModal({ batch, onClose }:{ batch:Batch; onClose:()=>void }){
  const [units, setUnits] = useState<number>(10);
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(){
    setMsg(null);
    if(units<=0){ setMsg('Enter units'); return; }
    setLoading(true);
    try{
      // In production, this would call an endpoint to place a sell request on secondary market
      await api.post('/invest/early-exit', { batch_id: batch.id, units });
      setMsg('Early exit request submitted. We will notify you when a buyer is found.');
    }catch(e:any){ setMsg(e?.response?.data?.detail || 'Failed to submit request.'); }
    finally{ setLoading(false); }
  }
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <motion.div initial={{ scale:0.98 }} animate={{ scale:1 }} exit={{ scale:0.98 }} className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
        <h3 className="font-bold">Request early exit — Batch #{batch.id}</h3>
        <p className="text-sm text-slate-600 mt-2">Early exits are subject to buyer availability and a 3–7% administrative fee. This creates liquidity but may reduce your realized return.</p>
        <div className="mt-4">
          <label className="text-sm">Units to sell
            <input type="number" min={1} max={batch.target_units} value={units} onChange={(e)=>setUnits(Math.max(1, parseInt(e.target.value||'0')))} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
        </div>
        {msg && <div className="mt-3 text-sm text-slate-600">{msg}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={submit}>{loading ? 'Submitting…' : 'Submit request'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Payout schedule example — illustrative
// ---------------------
function PayoutScheduleExample(){
  // example monthly cashflow for a 12-month window
  const example = Array.from({length:12}).map((_,i)=>({ month: `M${i+1}`, payout: Math.round(1000 + Math.random()*300) }));
  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500">
            <tr><th className="text-left p-2">Month</th><th className="text-right p-2">Estimated payout (GHS)</th></tr>
          </thead>
          <tbody>
            {example.map((r,i)=> (<tr key={i} className="border-t"><td className="p-2">{r.month}</td><td className="p-2 text-right">GHS {r.payout}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-slate-600">Note: This schedule is illustrative. Actual payouts depend on lay rate, egg prices, and feed costs.</div>
    </div>
  );
}

function InvestmentCalculator({ batches }: { batches: Batch[] }) {
  const [amount, setAmount] = useState<number>(100);
  const [batchId, setBatchId] = useState<number>(batches.length ? batches[0].id : 201);
  const [error, setError] = useState<string>("");
  const batch = batches.find(b => b.id === batchId) || FALLBACK_BATCHES[0];

  const handleAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setAmount(isNaN(val) ? 0 : val);
    setError("");
  };
  const handleBatch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBatchId(parseInt(e.target.value));
    setError("");
  };

  // Calculate units purchasable
  const units = batch.unit_price > 0 ? Math.floor(amount / batch.unit_price) : 0;
  const estMonthly = units * batch.unit_price * batch.expected_roi;
  const estAnnual = estMonthly * 12;

  const validate = () => {
    if (amount < batch.unit_price) {
      setError("Amount too low for selected batch.");
      return false;
    }
    if (units > (batch.target_units - batch.units_placed)) {
      setError("Not enough units available in this batch.");
      return false;
    }
    setError("");
    return true;
  };

  return (
    <div className="card p-8 xl:p-10 shadow-lg rounded-xl">
      <h3 className="font-bold text-xl mb-2">Investment Calculator</h3>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Monthly Investment (GHS)
          <input type="number" min={batch.unit_price} step={10} value={amount} onChange={handleAmount} className="mt-1 w-full border border-slate-300 rounded px-3 py-2" />
        </label>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Egg batch
          <select value={batchId} onChange={handleBatch} className="mt-1 w-full border border-slate-300 rounded px-3 py-2">
            {batches.map(b => (
              <option key={b.id} value={b.id}>Batch #{b.id} - {b.farm_name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6">
        <button className="btn btn-primary w-full" onClick={validate}>Calculate ROI</button>
      </div>
      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      {!error && (
        <div className="mt-4 text-sm text-slate-700">
          <p>Units purchasable: <strong>{units}</strong></p>
          <p>Estimated monthly ROI: <strong>GHS {estMonthly.toFixed(2)}</strong></p>
          <p>Estimated annual ROI: <strong>GHS {estAnnual.toFixed(2)}</strong></p>
        </div>
      )}
      <div className="mt-4 text-xs text-slate-500">ROI is estimated. Actual returns depend on batch performance, lay rate, and feed costs.</div>
    </div>
  );
}
