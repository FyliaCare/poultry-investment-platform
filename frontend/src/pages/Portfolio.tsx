// src/pages/Portfolio.tsx
import React, { useEffect, useMemo, useState } from "react";
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
 * Portfolio.tsx
 * - Wallet summary
 * - Investments table with sorting, search, pagination
 * - Line chart of recent investments
 * - Deposit / Withdraw modals
 * - CSV export / download
 */

/* ---------------- Types ---------------- */
type Wallet = { balance: number; updated_at?: string };
type Investment = {
  id: number;
  batch_id: number;
  units: number;
  amount: number;
  status: string;
  created_at?: string;
};

/* ---------------- Hook: Pagination ---------------- */
function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const total = Math.ceil(items.length / pageSize) || 1;
  const current = items.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > total) setPage(total); }, [total, page]);
  return { page, setPage, total, current };
}

/* ---------------- Utility: CSV Export ---------------- */
function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map(r =>
      header.map(h => {
        const v = r[h] ?? "";
        // escape quotes
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ---------------- Component ---------------- */
export default function Portfolio(): JSX.Element {
  // data
  const [wallet, setWallet] = useState<Wallet>({ balance: 0 });
  const [investments, setInvestments] = useState<Investment[]>([]);
  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // table: search / sort / filter / pagination
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc" | "amount_asc">("newest");
  const { page, setPage, total, current } = usePagination(
    useMemo(() => {
      // filtering
      let out = investments.slice();
      if (statusFilter !== "ALL") out = out.filter(i => i.status === statusFilter);
      if (query.trim()) {
        const q = query.toLowerCase();
        out = out.filter(i => String(i.id).includes(q) || String(i.batch_id).includes(q));
      }
      // sorting
      if (sortBy === "amount_desc") out.sort((a, b) => b.amount - a.amount);
      else if (sortBy === "amount_asc") out.sort((a, b) => a.amount - b.amount);
      else out.sort((a, b) => (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime()));
      return out;
    }, [investments, statusFilter, query, sortBy]),
    10
  );

  // fetch
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [w, inv] = await Promise.all([
        api.get("/invest/wallet"),
        api.get("/invest/my"),
      ]);
      setWallet(w.data);
      setInvestments(inv.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load portfolio. Check network or login.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // derived chart data - latest 10
  const chartData = useMemo(
    () => investments.slice(-10).map(inv => ({ name: `#${inv.id}`, amount: inv.amount })),
    [investments]
  );

  // deposit / withdraw flows
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnMsg, setTxnMsg] = useState<string | null>(null);

  async function deposit(amount: number) {
    setTxnLoading(true);
    setTxnMsg(null);
    try {
      await api.post("/invest/deposit", { amount });
      setTxnMsg("Deposit queued. Refreshing wallet...");
      await load();
      setShowDeposit(false);
    } catch (e:any) {
      setTxnMsg(e?.response?.data?.detail || "Deposit failed");
    } finally { setTxnLoading(false); }
  }

  async function withdraw(amount: number) {
    setTxnLoading(true);
    setTxnMsg(null);
    try {
      await api.post("/invest/withdraw", { amount });
      setTxnMsg("Withdrawal processed. Refreshing wallet...");
      await load();
      setShowWithdraw(false);
    } catch (e:any) {
      setTxnMsg(e?.response?.data?.detail || "Withdrawal failed");
    } finally { setTxnLoading(false); }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Your Portfolio</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDeposit(true)} className="btn btn-outline">Deposit</button>
          <button onClick={() => setShowWithdraw(true)} className="btn btn-primary">Withdraw</button>
        </div>
      </div>

      {loading && <div className="text-slate-500">Loading portfolio…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500">Wallet Balance</div>
          <div className="text-2xl font-bold">GHS {wallet.balance.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Active Investments</div>
          <div className="text-2xl font-bold">{investments.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Auto-Reinvest</div>
          <div className="text-2xl font-bold">Off</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">Recent Investment Amounts</div>
          <div className="text-xs text-slate-500">Latest {chartData.length} investments</div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v:number) => `GHS ${v.toFixed(2)}`} />
              <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by id or batch" className="border rounded px-3 py-2" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAID">Paid</option>
          <option value="EXITED">Exited</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="newest">Newest</option>
          <option value="amount_desc">Amount (high→low)</option>
          <option value="amount_asc">Amount (low→high)</option>
        </select>

        <button onClick={()=>exportToCSV("investments.csv", investments as any)} className="btn btn-outline ml-auto">Export CSV</button>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-bold">My Investments</div>
          <div className="text-sm text-slate-500">Showing {current.length} of {investments.length}</div>
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
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.map(inv => (
                <tr key={inv.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">#{inv.id}</td>
                  <td className="p-3">{inv.batch_id}</td>
                  <td className="p-3">{inv.units}</td>
                  <td className="p-3">GHS {inv.amount.toFixed(2)}</td>
                  <td className="p-3">{inv.status}</td>
                  <td className="p-3">
                    <button onClick={()=>{ /* open details / refund flow */ }} className="btn btn-outline btn-xs mr-2">Details</button>
                    <button onClick={()=>{ /* open reinvest UI */ }} className="btn btn-primary btn-xs">Reinvest</button>
                  </td>
                </tr>
              ))}
              {(!current.length && !loading) && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No investments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">Page {page} / {total}</div>
          <div className="flex gap-2">
            <button onClick={()=>setPage(Math.max(1, page-1))} className="btn btn-outline" disabled={page<=1}>Prev</button>
            <button onClick={()=>setPage(Math.min(total, page+1))} className="btn btn-outline" disabled={page>=total}>Next</button>
          </div>
        </div>

      </div>

      {/* Deposit / Withdraw modals */}
      {showDeposit && (
        <TransactionModal
          title="Deposit funds"
          onClose={() => setShowDeposit(false)}
          onSubmit={(amount) => deposit(amount)}
          loading={txnLoading}
          message={txnMsg}
          suggestedAmounts={[50,100,500]}
        />
      )}
      {showWithdraw && (
        <TransactionModal
          title="Withdraw funds"
          onClose={() => setShowWithdraw(false)}
          onSubmit={(amount) => withdraw(amount)}
          loading={txnLoading}
          message={txnMsg}
          suggestedAmounts={[50,100,500]}
          maxAmount={wallet.balance}
        />
      )}

    </div>
  );
}

/* ---------------- Transaction modal ---------------- */
function TransactionModal({ title, onClose, onSubmit, loading, message, suggestedAmounts, maxAmount }:
  { title: string; onClose: ()=>void; onSubmit: (amt:number)=>Promise<void>; loading: boolean; message: string|null; suggestedAmounts?: number[]; maxAmount?: number }) {
  const [amount, setAmount] = useState<number>(suggestedAmounts?.[0] || 50);
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow">
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="mt-4">
          <div className="flex gap-2 mb-2">
            {suggestedAmounts?.map(s => <button key={s} onClick={()=>setAmount(s)} className="btn btn-outline btn-sm">{s}</button>)}
          </div>
          <label className="block text-sm">Amount (GHS)
            <input type="number" min={0} max={maxAmount} value={amount} onChange={e=>setAmount(Number(e.target.value))} className="border rounded px-3 py-2 w-full mt-1" />
          </label>
          {maxAmount !== undefined && <div className="text-xs text-slate-500 mt-1">Available: GHS {maxAmount.toFixed(2)}</div>}
        </div>
        {message && <div className="mt-3 text-sm text-slate-600">{message}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" onClick={()=>onSubmit(amount)} disabled={loading}>{loading ? "Processing…" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}
