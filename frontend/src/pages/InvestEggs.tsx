import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../store/auth";

// ---------------------------------------------------------
// Types and demo data
// ---------------------------------------------------------
type Batch = {
  id: number;
  farm_name?: string;
  location?: string;
  product_type?: "EGG" | "CHICKEN";
  unit_price: number;
  target_units: number;
  units_placed: number;
  expected_roi: number; // monthly decimal, e.g. 0.01 => 1%
  status: string;
  feed_price?: number;
  mortality_rate?: number; // decimal 0-1
  history?: { label: string; roi_percent: number }[];
};

const FALLBACK_BATCHES: Readonly<Batch[]> = Object.freeze([
  {
    id: 201,
    farm_name: "Sunrise Layers",
    location: "Eastern Region, Ghana",
    product_type: "EGG",
    unit_price: 120,
    target_units: 5000,
    units_placed: 1750,
    expected_roi: 0.01,
    status: "OPEN",
    feed_price: 4.2,
    mortality_rate: 0.02,
    history: [
      { label: "Jan", roi_percent: 1.0 },
      { label: "Feb", roi_percent: 1.1 },
      { label: "Mar", roi_percent: 1.2 },
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
    expected_roi: 0.009,
    status: "ACTIVE",
    feed_price: 4.0,
    mortality_rate: 0.03,
    history: [
      { label: "Jan", roi_percent: 0.9 },
      { label: "Feb", roi_percent: 1.0 },
      { label: "Mar", roi_percent: 1.05 },
    ],
  },
]);

const DEFAULT_SENSORS = Object.freeze({ temp: 28, humidity: 65, ammonia: 12 });
const DEFAULT_CERTS = Object.freeze(["GAP", "Biosecurity", "Traceability"]);
const DEFAULT_TIMELINE = Object.freeze([
  { label: "Start", date: "2025-09-01" },
  { label: "Audit", date: "2025-10-01" },
  { label: "End", date: "2026-09-01" },
]);

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------
const fmtGHS = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 });
const fmtPct = (v: number, digits = 2) => `${(v * 100).toFixed(digits)}%`;
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

// Little motion preset
const fadeScale = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.15 },
};

export default function InvestEggs() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("recommended");
  const [investFor, setInvestFor] = useState<Batch | null>(null);
  const [auditFor, setAuditFor] = useState<Batch | null>(null);
  const [earlyExitFor, setEarlyExitFor] = useState<Batch | null>(null);

  // Track mounted to avoid setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    async function load() {
      setLoading(true);
      setError(null);
      let eggs: Batch[] = [];
      try {
        const res = await api.get("/public/products");
        const products = Array.isArray(res.data) ? res.data : res?.data?.products ?? [];
        eggs = (products as any[]).filter((b: any) => b?.product_type === "EGG");
      } catch (e) {
        if (mountedRef.current) setError("Could not load egg batches — showing demo data.");
      } finally {
        if (mountedRef.current) {
          setBatches(eggs.length ? eggs : [...FALLBACK_BATCHES]);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let out = [...batches];
    if (status !== "ALL") out = out.filter((b) => b.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (b) =>
          String(b.id).includes(q) ||
          (b.farm_name ?? "").toLowerCase().includes(q) ||
          (b.location ?? "").toLowerCase().includes(q)
      );
    }
    if (sort === "roi") out.sort((a, b) => b.expected_roi - a.expected_roi);
    else if (sort === "availability")
      out.sort((a, b) => b.target_units - b.units_placed - (a.target_units - a.units_placed));
    else if (sort === "cheapest") out.sort((a, b) => a.unit_price - b.unit_price);
    // Always show demo data if nothing matches
    if (out.length === 0) return [...FALLBACK_BATCHES];
    return out;
  }, [batches, search, status, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold mb-2">🥚 Invest in Eggs</h1>
      <p className="mb-6 text-slate-600">Invest in layer batches for steady monthly payouts. Transparent reporting and wallet payouts.</p>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Search by batch, farm or location"
          aria-label="Search batches"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2" aria-label="Filter by status">
          <option value="ALL">All</option>
          <option value="OPEN">Open</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-lg px-3 py-2" aria-label="Sort batches">
          <option value="recommended">Recommended</option>
          <option value="roi">Highest monthly ROI</option>
          <option value="availability">Most available units</option>
          <option value="cheapest">Lowest unit price</option>
        </select>
      </div>

      {error && <div className="mb-4 text-red-500" role="alert">{error}</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse card p-6 h-56 bg-white border border-slate-100 rounded-lg shadow-sm" />
          ))}
        {!loading &&
          filtered.map((b) => (
            <EggBatchCard key={b.id} batch={b} onInvest={setInvestFor} onAudit={setAuditFor} onEarlyExit={setEarlyExitFor} />
          ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-600 py-12">No matching batches — try clearing filters or check back later.</div>
        )}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-8">
        <InvestmentCalculator batches={filtered.length ? filtered : [...FALLBACK_BATCHES]} />
        <PayoutScheduleExample />
      </div>

      <AnimatePresence>
        {investFor && (
          <EggInvestModal batch={investFor} onClose={() => setInvestFor(null)} onSuccess={() => setInvestFor(null)} />
        )}
        {auditFor && <EggAuditModal batch={auditFor} onClose={() => setAuditFor(null)} />}
        {earlyExitFor && <EarlyExitModal batch={earlyExitFor} onClose={() => setEarlyExitFor(null)} />}
      </AnimatePresence>
    </div>
  );
}

function EggBatchCard({ batch, onInvest, onAudit, onEarlyExit }: { batch: Batch; onInvest: (b: Batch) => void; onAudit: (b: Batch) => void; onEarlyExit: (b: Batch) => void }) {
  const sensors = DEFAULT_SENSORS;
  const certs = DEFAULT_CERTS;
  const timeline = DEFAULT_TIMELINE;
  const available = Math.max(0, (batch.target_units ?? 0) - (batch.units_placed ?? 0));
  const annualized = (batch.expected_roi ?? 0) * 12;

  const chartData = useMemo(() => (batch.history?.map((h) => ({ name: h.label, v: h.roi_percent })) ?? []), [batch.history]);

  return (
    <div className="card overflow-hidden p-4 rounded-xl border border-slate-100 shadow-sm bg-white">
      <div className="flex justify-between items-start flex-wrap gap-1">
        <div>
          <div className="text-xs text-slate-500">Layer • Batch #{batch.id}</div>
          <div className="font-semibold">
            {batch.farm_name} <span className="text-xs text-slate-500">• {batch.location}</span>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`px-2 py-0.5 rounded text-xs ${batch.status === "OPEN" ? "bg-green-100 text-green-700" : batch.status === "ACTIVE" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
            aria-label={`Status ${batch.status}`}
          >
            {batch.status}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600 grid grid-cols-2 gap-2">
        <div>Unit price: <span className="font-semibold">{fmtGHS.format(batch.unit_price)}</span></div>
        <div>Available: <span className="font-semibold">{available}</span></div>
        <div>Est monthly ROI: <span className="font-semibold">{fmtPct(batch.expected_roi)}</span></div>
        <div>Annualised (approx): <span className="font-semibold">{fmtPct(annualized, 1)}</span></div>
        <div>Feed cost/kg: <span className="font-semibold">{batch.feed_price ? fmtGHS.format(batch.feed_price) : "TBD"}</span></div>
        <div>Mortality: <span className="font-semibold">{fmtPct(batch.mortality_rate ?? 0)}</span></div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1 bg-slate-50 rounded p-3 flex flex-col justify-center">
          <SensorBars sensors={sensors} />
        </div>
        <div className="w-full sm:w-36 h-20 min-w-[100px] max-w-[140px] mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${batch.id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis hide domain={[0, "dataMax + 0.5"]} />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
              <Line type="monotone" dataKey="v" stroke={`url(#grad-${batch.id})`} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">Certs: {certs.join(", ")}</div>
      <div className="mt-1 text-xs text-slate-500">Timeline: {timeline.map((t) => `${t.label} ${t.date}`).join(" • ")}</div>

      <RiskBadgeEgg batch={batch} />

      <div className="mt-4 flex items-center gap-1">
        <div className="flex gap-1">
          <button
            className="btn btn-primary btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="Invest in this batch for monthly payouts"
            onClick={() => onInvest(batch)}
          >
            <span className="material-icons" style={{ fontSize: "15px" }} aria-hidden>
              trending_up
            </span>
            Invest
          </button>
          <button
            className="btn btn-outline btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="View audit and batch health details"
            onClick={() => onAudit(batch)}
          >
            <span className="material-icons" style={{ fontSize: "15px" }} aria-hidden>
              fact_check
            </span>
            Audit
          </button>
          <button
            className="btn btn-ghost btn-sm flex items-center gap-1 px-2 py-1 text-xs"
            title="Request early exit (sell units)"
            onClick={() => onEarlyExit(batch)}
          >
            <span className="material-icons" style={{ fontSize: "15px" }} aria-hidden>
              logout
            </span>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function SensorBars({ sensors }: { sensors: { temp: number; humidity: number; ammonia: number } }) {
  // Simple thresholds for display colouring
  const tempPct = clamp((sensors.temp / 40) * 100, 0, 100);
  const humPct = clamp(sensors.humidity, 0, 100);
  const nh3Pct = clamp((sensors.ammonia / 50) * 100, 0, 100); // assuming 50ppm critical
  const nh3Label = `${sensors.ammonia}ppm`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-xs text-slate-500">Sensors</div>

      <div className="flex items-center gap-2">
        <div className="text-xs">Temp</div>
        <div className="w-28 bg-slate-100 rounded-full overflow-hidden" aria-label={`Temperature ${sensors.temp}°C`}>
          <div style={{ width: `${tempPct}%` }} className={`h-2 ${sensors.temp > 33 ? "bg-orange-400" : sensors.temp < 22 ? "bg-blue-300" : "bg-green-400"}`} />
        </div>
        <div className="text-xs text-slate-500">{sensors.temp}°C</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs">Hum</div>
        <div className="w-20 bg-slate-100 rounded-full overflow-hidden" aria-label={`Humidity ${sensors.humidity}%`}>
          <div style={{ width: `${humPct}%` }} className={`h-2 ${sensors.humidity > 80 ? "bg-blue-400" : sensors.humidity < 40 ? "bg-yellow-300" : "bg-green-400"}`} />
        </div>
        <div className="text-xs text-slate-500">{sensors.humidity}%</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs">NH3</div>
        <div className="w-24 bg-slate-100 rounded-full overflow-hidden" aria-label={`Ammonia ${nh3Label}`}>
          <div style={{ width: `${nh3Pct}%` }} className={`h-2 ${sensors.ammonia >= 25 ? "bg-red-400" : sensors.ammonia >= 15 ? "bg-amber-400" : "bg-green-400"}`} />
        </div>
        <div className="text-xs text-slate-500">{nh3Label}</div>
      </div>
    </div>
  );
}

function RiskBadgeEgg({ batch }: { batch: Batch }) {
  // Weighted risk heuristic tailored for layers (0-100)
  const mortality = (batch.mortality_rate ?? 0) * 100; // %
  const roiAnnual = (batch.expected_roi ?? 0) * 12; // decimal
  const fillRatio = (batch.units_placed ?? 0) / Math.max(1, batch.target_units ?? 1);

  // Weights
  const wMortality = 0.5;
  const wRoi = 0.3; // lower ROI => higher risk (conservatively)
  const wFill = 0.2; // fuller batches slightly lower liquidity risk

  const score = Math.round(
    clamp(
      wMortality * mortality +
        wRoi * (1 - roiAnnual) * 100 +
        wFill * Math.max(0, (1 - fillRatio) * 100 * 0.6),
      0,
      100
    )
  );
  const level = score > 60 ? "High" : score > 30 ? "Medium" : "Low";
  const color = level === "High" ? "bg-red-100 text-red-700" : level === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";

  return (
    <div className={`mt-3 inline-flex items-center gap-2 px-2 py-1 rounded text-xs ${color}`} title={`Composite risk score ${score}/100`}>
      <span className="font-semibold">Risk: {level}</span>
      <span className="opacity-70">(score {score})</span>
    </div>
  );
}

// ---------------------
// Invest modal for eggs (monthly payouts, auto-reinvest option)
// ---------------------
function EggInvestModal({ batch, onClose, onSuccess }: { batch: Batch; onClose: () => void; onSuccess: (units: number) => void }) {
  const [units, setUnits] = useState<number>(10);
  const [auto, setAuto] = useState<boolean>(false);
  const [agree, setAgree] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { isAuthed } = useAuth();
  const available = Math.max(0, (batch.target_units ?? 0) - (batch.units_placed ?? 0));
  const cost = units * (batch.unit_price ?? 0);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = useCallback(async () => {
    setMsg(null);
    if (!isAuthed) {
      setMsg("Please log in to invest.");
      return;
    }
    if (units <= 0) {
      setMsg("Enter a positive units amount.");
      return;
    }
    if (units > available) {
      setMsg("Not enough units available.");
      return;
    }
    if (!agree) {
      setMsg("Please accept terms & risk disclosure.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/invest/create", { batch_id: batch.id, units, auto_reinvest: auto });
      onSuccess(units);
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Failed to create investment.");
    } finally {
      setLoading(false);
    }
  }, [agree, available, auto, batch.id, isAuthed, onSuccess, units]);

  const estMonthly = units * (batch.unit_price ?? 0) * (batch.expected_roi ?? 0);
  const estAnnual = estMonthly * 12;

  return (
    <motion.div {...fadeScale} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal role="dialog" aria-label={`Invest in Layer Batch ${batch.id}`}>
      <motion.div {...fadeScale} className="bg-white rounded-lg p-6 shadow-lg max-w-xl w-full">
        <h3 className="text-lg font-bold">Invest in Layer Batch #{batch.id}</h3>
        <p className="text-sm text-slate-600">Unit {fmtGHS.format(batch.unit_price)} • Available {available}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">Units
            <input
              type="number"
              min={1}
              max={available}
              value={units}
              onChange={(e) => setUnits(clamp(parseInt(e.target.value || "0"), 1, Math.max(1, available)))}
              className="mt-1 w-full border rounded px-3 py-2"
              inputMode="numeric"
            />
          </label>
          <div>
            <div className="text-sm text-slate-500">Cost</div>
            <div className="font-semibold">{fmtGHS.format(cost)}</div>
            <div className="text-xs text-slate-500 mt-1">Est monthly payout: {fmtGHS.format(estMonthly)} • Est annual: {fmtGHS.format(estAnnual)}</div>
          </div>
        </div>

        <div className="mt-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            <span className="text-sm">Enable Auto‑Reinvest (roll monthly payouts into new batches)</span>
          </label>
        </div>

        <div className="mt-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="text-sm">
              I have read the <a href="/terms" className="underline text-emerald-700">terms & risk disclosure</a>.
            </span>
          </label>
        </div>

        {msg && <div className="mt-3 text-sm text-red-600" role="alert">{msg}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={submit}>{loading ? "Processing…" : `Invest ${fmtGHS.format(units * (batch.unit_price ?? 0))}`}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Audit modal
// ---------------------
function EggAuditModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const audit = {
    last_audit: "2025-08-20",
    mortality: `${((batch.mortality_rate ?? 0) * 100).toFixed(2)}%`,
    sensor: DEFAULT_SENSORS,
    notes: "Biosecurity measures validated. Feed quality pass. No critical issues.",
  };
  return (
    <motion.div {...fadeScale} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal role="dialog" aria-label={`Audit for Batch ${batch.id}`}>
      <motion.div {...fadeScale} className="bg-white rounded-lg p-6 shadow max-w-md w-full">
        <h3 className="font-bold text-lg">Audit — Batch #{batch.id}</h3>
        <div className="mt-3 text-sm text-slate-700">
          <div>
            <strong>Last audit:</strong> {audit.last_audit}
          </div>
          <div>
            <strong>Mortality:</strong> {audit.mortality}
          </div>
          <div className="mt-2">
            <strong>Sensors:</strong> Temp {audit.sensor.temp}°C • Humidity {audit.sensor.humidity}% • NH3 {audit.sensor.ammonia}ppm
          </div>
          <div className="mt-2">
            <strong>Notes:</strong> {audit.notes}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <a className="btn btn-primary" href="#" onClick={(e) => { e.preventDefault(); window.alert("Download report (demo)"); }}>
            Download PDF
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Early exit request modal (demo)
// ---------------------
function EarlyExitModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const [units, setUnits] = useState<number>(10);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = useCallback(async () => {
    setMsg(null);
    if (units <= 0) {
      setMsg("Enter units");
      return;
    }
    setLoading(true);
    try {
      await api.post("/invest/early-exit", { batch_id: batch.id, units });
      setMsg("Early exit request submitted. We will notify you when a buyer is found.");
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  }, [batch.id, units]);

  return (
    <motion.div {...fadeScale} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" aria-modal role="dialog" aria-label={`Early exit for Batch ${batch.id}`}>
      <motion.div {...fadeScale} className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
        <h3 className="font-bold">Request early exit — Batch #{batch.id}</h3>
        <p className="text-sm text-slate-600 mt-2">Early exits are subject to buyer availability and a 3–7% administrative fee. This creates liquidity but may reduce your realized return.</p>
        <div className="mt-4">
          <label className="text-sm">Units to sell
            <input
              type="number"
              min={1}
              max={batch.target_units}
              value={units}
              onChange={(e) => setUnits(clamp(parseInt(e.target.value || "0"), 1, Math.max(1, batch.target_units || 1)))}
              className="mt-1 w-full border rounded px-3 py-2"
              inputMode="numeric"
            />
          </label>
        </div>
        {msg && <div className="mt-3 text-sm text-slate-600" role="status">{msg}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading} onClick={submit}>{loading ? "Submitting…" : "Submit request"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------
// Payout schedule example — illustrative
// ---------------------
function PayoutScheduleExample() {
  // Deterministic example monthly cashflow for a 12-month window
  const example = useMemo(
    () => Array.from({ length: 12 }).map((_, i) => ({ month: `M${i + 1}`, payout: 1000 + (i % 3) * 120 })),
    []
  );
  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="text-left p-2">Month</th>
              <th className="text-right p-2">Estimated payout (GHS)</th>
            </tr>
          </thead>
          <tbody>
            {example.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.month}</td>
                <td className="p-2 text-right">{fmtGHS.format(r.payout)}</td>
              </tr>
            ))}
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
  const batch = batches.find((b) => b.id === batchId) || FALLBACK_BATCHES[0];

  const handleAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setAmount(Number.isFinite(val) ? Math.max(0, val) : 0);
    setError("");
  };
  const handleBatch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBatchId(parseInt(e.target.value));
    setError("");
  };

  // Calculate units purchasable
  const units = useMemo(() => (batch.unit_price > 0 ? Math.floor(amount / batch.unit_price) : 0), [amount, batch.unit_price]);
  const available = Math.max(0, (batch.target_units ?? 0) - (batch.units_placed ?? 0));
  const estMonthly = units * (batch.unit_price ?? 0) * (batch.expected_roi ?? 0);
  const estAnnual = estMonthly * 12;

  const validate = () => {
    if (amount < (batch.unit_price ?? 0)) {
      setError("Amount too low for selected batch.");
      return false;
    }
    if (units > available) {
      setError("Not enough units available in this batch.");
      return false;
    }
    setError("");
    return true;
  };

  return (
    <div className="card p-8 xl:p-10 shadow-lg rounded-xl bg-white">
      <h3 className="font-bold text-xl mb-2">Investment Calculator</h3>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Monthly Investment (GHS)
          <input
            type="number"
            min={batch.unit_price}
            step={10}
            value={amount}
            onChange={handleAmount}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Egg batch
          <select value={batchId} onChange={handleBatch} className="mt-1 w-full border border-slate-300 rounded px-3 py-2">
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Batch #{b.id} - {b.farm_name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6">
        <button className="btn btn-primary w-full" onClick={validate}>Calculate ROI</button>
      </div>
      {error && <div className="mt-4 text-sm text-red-600" role="alert">{error}</div>}
      {!error && (
        <div className="mt-4 text-sm text-slate-700">
          <p>Units purchasable: <strong>{units}</strong></p>
          <p>Estimated monthly ROI: <strong>{fmtGHS.format(estMonthly)}</strong></p>
          <p>Estimated annual ROI: <strong>{fmtGHS.format(estAnnual)}</strong></p>
        </div>
      )}
      <div className="mt-4 text-xs text-slate-500">ROI is estimated. Actual returns depend on batch performance, lay rate, and feed costs.</div>
    </div>
  );
}
