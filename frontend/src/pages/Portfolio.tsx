import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/**
 * Portfolio.tsx — Advanced investor portfolio page
 *
 * Features:
 * - wallet summary + quick actions (deposit / withdraw)
 * - recent investments chart
 * - investments table with search, filters, sorting & pagination
 * - CSV export of filtered view
 * - details modal (payout history) + reinvest modal
 * - toast notifications & robust error handling
 */

/* ---------------- Types ---------------- */
type Wallet = { balance: number; updated_at?: string | null };
type Investment = {
  id: number;
  batch_id: number;
  units: number;
  amount: number;
  status: string;
  created_at?: string | null;
};
type Payout = { id: number; amount: number; kind: string; created_at?: string | null };

/* ---------------- Helpers ---------------- */
const currency = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 });

function formatCurrency(n: number) {
  return currency.format(n);
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

/** export CSV with BOM (Excel-friendly), custom headers order/labels */
function exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || !rows.length) return;
  const cols = headers ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }));
  const csvRows = [];
  csvRows.push(cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(","));
  for (const row of rows) {
    const values = cols.map(c => {
      const val = row[c.key];
      const s = val === null || val === undefined ? "" : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }
  const csv = csvRows.join("\r\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ---------------- Pagination Hook (advanced) ---------------- */
function usePagination<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => {
    if (page > total) setPage(total);
  }, [total, page]);
  const current = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageSize, setPageSize, total, current };
}

/* ---------------- Main Component ---------------- */
export default function Portfolio(): JSX.Element {
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, updated_at: null });
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // filters & sorting
  const [query, setQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState<string | "">("");
  const [dateTo, setDateTo] = useState<string | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc" | "amount_asc">("newest");

  // modal & UI state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnMsg, setTxnMsg] = useState<string | null>(null);

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const [showReinvest, setShowReinvest] = useState(false);
  const [reinvestLoading, setReinvestLoading] = useState(false);

  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastId = useRef(1);

  // local abort controller for fetch
  const abortRef = useRef<AbortController | null>(null);

  // pagination for filtered result
  const filtered = useMemo(() => {
    let out = investments.slice();

    // text search: match id or batch_id
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(i => String(i.id).includes(q) || String(i.batch_id).includes(q));
    }

    // status filter
    if (statusFilter !== "ALL") out = out.filter(i => i.status === statusFilter);

    // amount range
    if (minAmount !== "") out = out.filter(i => i.amount >= Number(minAmount));
    if (maxAmount !== "") out = out.filter(i => i.amount <= Number(maxAmount));

    // date range
    if (dateFrom) {
      const fromT = new Date(dateFrom).getTime();
      out = out.filter(i => i.created_at && new Date(i.created_at).getTime() >= fromT);
    }
    if (dateTo) {
      // include whole day
      const toT = new Date(dateTo);
      toT.setHours(23, 59, 59, 999);
      out = out.filter(i => i.created_at && new Date(i.created_at).getTime() <= toT.getTime());
    }

    // sort
    if (sortBy === "amount_desc") out.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "amount_asc") out.sort((a, b) => a.amount - b.amount);
    else out.sort((a, b) => (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));

    return out;
  }, [investments, query, statusFilter, minAmount, maxAmount, dateFrom, dateTo, sortBy]);

  const { page, setPage, pageSize, setPageSize, total, current } = usePagination(filtered, 10);

  const load = async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const [w, inv] = await Promise.all([
        api.get("/invest/wallet", { signal: ac.signal }),
        api.get("/invest/my", { signal: ac.signal }),
      ]);
      setWallet(w.data);
      setInvestments(inv.data || []);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.message === "canceled") {
        // aborted request — ignore
      } else {
        console.error("Portfolio load failed:", err);
        setError("Failed to load portfolio. Please check your network or login.");
        pushToast("Failed to load portfolio");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = (text: string) => {
    const id = toastId.current++;
    setToasts(t => [...t, { id, text }]);
    // auto remove
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  };

  // derived chart data (last 12 invest)
  const chartData = useMemo(
    () => investments.slice(-12).map(i => ({ name: `#${i.id}`, amount: i.amount })),
    [investments]
  );

  /* ---------- Actions: deposit / withdraw ---------- */
  async function deposit(amount: number) {
    setTxnLoading(true);
    setTxnMsg(null);
    try {
      const r = await api.post("/invest/deposit", { amount });
      pushToast("Deposit successful");
      setTxnMsg("Deposit processed. Refreshing...");
      await load();
      setShowDeposit(false);
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? "Deposit failed";
      setTxnMsg(detail);
      pushToast(detail);
    } finally {
      setTxnLoading(false);
    }
  }

  async function withdraw(amount: number) {
    if (amount > wallet.balance) {
      setTxnMsg("Insufficient balance");
      return;
    }
    if (!confirm(`Withdraw GHS ${amount.toFixed(2)}?`)) return;
    setTxnLoading(true);
    setTxnMsg(null);
    try {
      const r = await api.post("/invest/withdraw", { amount });
      pushToast("Withdrawal processed");
      setTxnMsg("Withdrawal processed. Refreshing...");
      await load();
      setShowWithdraw(false);
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? "Withdrawal failed";
      setTxnMsg(detail);
      pushToast(detail);
    } finally {
      setTxnLoading(false);
    }
  }

  /* ---------- Details / payouts ---------- */
  async function openDetails(inv: Investment) {
    setSelectedInvestment(inv);
    setShowDetails(true);
    setPayouts(null);
    setPayoutsLoading(true);
    try {
      const r = await api.get(`/invest/${inv.id}/payouts`);
      setPayouts(r.data || []);
    } catch (e: any) {
      console.error("Failed fetching payouts", e);
      pushToast("Failed to load payout history");
    } finally {
      setPayoutsLoading(false);
    }
  }

  /* ---------- Reinvest ---------- */
  async function reinvest(investment: Investment, units: number) {
    setReinvestLoading(true);
    try {
      // Reinvest: create a new investment on same batch
      // endpoint: POST /invest/create { batch_id, units }
      await api.post("/invest/create", { batch_id: investment.batch_id, units });
      pushToast("Reinvest successful, refreshing...");
      await load();
      setShowReinvest(false);
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? "Reinvest failed";
      pushToast(detail);
    } finally {
      setReinvestLoading(false);
    }
  }

  /* ---------- Export filtered investments CSV (user-facing headers) ---------- */
  function exportFilteredCSV() {
    if (!filtered.length) {
      pushToast("No records to export");
      return;
    }
    const headers = [
      { key: "id", label: "Investment ID" },
      { key: "batch_id", label: "Batch ID" },
      { key: "units", label: "Units" },
      { key: "amount", label: "Amount (GHS)" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created At" },
    ];
    const rows = filtered.map(r => ({
      id: r.id,
      batch_id: r.batch_id,
      units: r.units,
      amount: r.amount.toFixed(2),
      status: r.status,
      created_at: r.created_at ?? "",
    }));
    exportToCSV(`investments_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
    pushToast("CSV exported");
  }

  /* ---------- Small helper: clear filters ---------- */
  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setMinAmount("");
    setMaxAmount("");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    setPage(1);
  }

  /* ---------- Render ---------- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Your Portfolio</h1>
          <p className="text-sm text-slate-500">Track investments, payouts and manage wallet.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={load} className="btn btn-outline" aria-label="Refresh" disabled={loading}>
            Refresh
          </button>
          <button onClick={exportFilteredCSV} className="btn btn-outline">Export</button>
        </div>
      </div>

      {/* Top stats + actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Wallet Balance</div>
          <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
          <div className="text-xs text-slate-400 mt-1">Updated: {formatDate(wallet.updated_at)}</div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-slate-500">Investments</div>
          <div className="text-2xl font-bold">{investments.length}</div>
          <div className="text-xs text-slate-400 mt-1">Active / total</div>
        </div>

        <div className="card p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500">Auto-Reinvest</div>
            <div className="text-2xl font-bold">Off</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setShowDeposit(true)} className="btn btn-outline">Deposit</button>
            <button onClick={() => setShowWithdraw(true)} className="btn btn-primary">Withdraw</button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">Recent Investments</div>
          <div className="text-xs text-slate-500">{chartData.length} point(s)</div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => v.toFixed(0)} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Filters */}
      <section className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500">Search</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ID, batch id" className="border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-xs text-slate-500">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PAID">Paid</option>
              <option value="EXITED">Exited</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500">Amount ≥</label>
            <input type="number" value={minAmount as any} onChange={e => setMinAmount(e.target.value === "" ? "" : Number(e.target.value))} className="border rounded px-3 py-2 w-28" />
          </div>

          <div>
            <label className="block text-xs text-slate-500">Amount ≤</label>
            <input type="number" value={maxAmount as any} onChange={e => setMaxAmount(e.target.value === "" ? "" : Number(e.target.value))} className="border rounded px-3 py-2 w-28" />
          </div>

          <div>
            <label className="block text-xs text-slate-500">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-xs text-slate-500">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-xs text-slate-500">Sort</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-3 py-2">
              <option value="newest">Newest</option>
              <option value="amount_desc">Amount (high → low)</option>
              <option value="amount_asc">Amount (low → high)</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearFilters} className="btn btn-ghost">Clear</button>
            <div>
              <label className="block text-xs text-slate-500">Per page</label>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-3 py-2">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-bold">My Investments</div>
          <div className="text-sm text-slate-500">Showing {filtered.length} results — page {page} / {total}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Batch</th>
                <th className="p-3 text-left">Units</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.map(inv => (
                <tr key={inv.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">#{inv.id}</td>
                  <td className="p-3">{inv.batch_id}</td>
                  <td className="p-3">{inv.units}</td>
                  <td className="p-3">{formatCurrency(inv.amount)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${inv.status === "ACTIVE" ? "bg-green-100 text-green-700" : inv.status === "PAID" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">{formatDate(inv.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openDetails(inv)} className="btn btn-outline btn-xs">Details</button>
                      <button onClick={() => { setSelectedInvestment(inv); setShowReinvest(true); }} className="btn btn-primary btn-xs">Reinvest</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && current.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">No investments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">Page {page} of {total}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="btn btn-outline" disabled={page <= 1}>Prev</button>
            <button onClick={() => setPage(Math.min(total, page + 1))} className="btn btn-outline" disabled={page >= total}>Next</button>
          </div>
        </div>
      </section>

      {/* DETAILS MODAL */}
      {showDetails && selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Investment #{selectedInvestment.id} — Payouts</h3>
                <div className="text-xs text-slate-500 mt-1">Batch #{selectedInvestment.batch_id} • {selectedInvestment.units} units • {formatCurrency(selectedInvestment.amount)}</div>
              </div>
              <div>
                <button onClick={() => setShowDetails(false)} className="btn btn-ghost">Close</button>
              </div>
            </div>

            <div className="mt-4">
              {payoutsLoading && <div className="text-slate-500">Loading payouts…</div>}
              {!payoutsLoading && payouts && payouts.length === 0 && <div className="text-slate-500">No payouts yet for this investment.</div>}
              {!payoutsLoading && payouts && payouts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-slate-50">
                      <tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Kind</th><th className="p-2 text-left">Date</th></tr>
                    </thead>
                    <tbody>
                      {payouts.map(p => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{p.id}</td>
                          <td className="p-2">{formatCurrency(p.amount)}</td>
                          <td className="p-2">{p.kind}</td>
                          <td className="p-2">{formatDate(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-slate-500">Payouts are generated by the platform at harvest/monthly schedules.</div>
              <div className="flex gap-2">
                <button onClick={() => { if (payouts) exportToCSV(`payouts_inv_${selectedInvestment.id}.csv`, payouts.map(p => ({ id: p.id, amount: p.amount.toFixed(2), kind: p.kind, created_at: p.created_at })), [{ key: "id", label: "Payout ID" }, { key: "amount", label: "Amount" }, { key: "kind", label: "Kind" }, { key: "created_at", label: "Date" }]); pushToast("Payout CSV downloaded"); }} className="btn btn-outline">Download CSV</button>
                <button onClick={() => setShowDetails(false)} className="btn btn-primary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REINVEST MODAL */}
      {showReinvest && selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold">Reinvest into Batch #{selectedInvestment.batch_id}</h3>
            <p className="text-sm text-slate-500 mt-1">Create a new investment by buying units in the same batch.</p>

            <ReinvestForm
              investment={selectedInvestment}
              onCancel={() => setShowReinvest(false)}
              onSubmit={async (units) => {
                await reinvest(selectedInvestment, units);
              }}
              loading={reinvestLoading}
            />
          </div>
        </div>
      )}

      {/* Deposit / Withdraw modals (reuse simpler Transaction modal) */}
      {showDeposit && (
        <TransactionModal
          title="Deposit funds"
          onClose={() => { setShowDeposit(false); setTxnMsg(null); }}
          onSubmit={deposit}
          loading={txnLoading}
          message={txnMsg}
          suggestedAmounts={[50, 100, 500]}
        />
      )}
      {showWithdraw && (
        <TransactionModal
          title="Withdraw funds"
          onClose={() => { setShowWithdraw(false); setTxnMsg(null); }}
          onSubmit={withdraw}
          loading={txnLoading}
          message={txnMsg}
          suggestedAmounts={[50, 100, 500]}
          maxAmount={wallet.balance}
        />
      )}

      {/* Toasts */}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-black text-white px-4 py-2 rounded shadow">{t.text}</div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Transaction modal ---------------- */
function TransactionModal({ title, onClose, onSubmit, loading, message, suggestedAmounts, maxAmount }:
  { title: string; onClose: () => void; onSubmit: (amt: number) => Promise<void>; loading: boolean; message?: string | null; suggestedAmounts?: number[]; maxAmount?: number }) {
  const [amount, setAmount] = useState<number>(suggestedAmounts?.[0] ?? 50);
  useEffect(() => { setAmount(suggestedAmounts?.[0] ?? 50); }, [suggestedAmounts]);
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>

        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            {suggestedAmounts?.map(s => <button key={s} onClick={() => setAmount(s)} className="btn btn-outline btn-sm">{formatCurrency(s)}</button>)}
          </div>

          <label className="block text-sm">Amount (GHS)
            <input type="number" min={0} max={maxAmount} value={amount} onChange={e => setAmount(Number(e.target.value))} className="border rounded px-3 py-2 w-full mt-1" />
          </label>
          {typeof maxAmount === "number" && <div className="text-xs text-slate-500 mt-1">Available: {formatCurrency(maxAmount)}</div>}
        </div>

        {message && <div className="mt-3 text-sm text-slate-600">{message}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button onClick={() => onSubmit(amount)} className="btn btn-primary" disabled={loading}>{loading ? "Processing…" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reinvest form component ---------------- */
function ReinvestForm({ investment, onCancel, onSubmit, loading }: { investment: Investment; onCancel: () => void; onSubmit: (units: number) => Promise<void>; loading: boolean }) {
  const [units, setUnits] = useState<number>(1);
  return (
    <div className="mt-4">
      <label className="block text-sm">Units to buy
        <input type="number" min={1} value={units} onChange={e => setUnits(Number(e.target.value))} className="border rounded px-3 py-2 w-full mt-1" />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-outline">Cancel</button>
        <button onClick={() => onSubmit(units)} className="btn btn-primary" disabled={loading}>{loading ? "Processing…" : `Buy ${units}`}</button>
      </div>
    </div>
  );
}
