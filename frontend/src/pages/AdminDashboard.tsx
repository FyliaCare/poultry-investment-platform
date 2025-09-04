import React, { useEffect, useState } from "react";
import api from "../api/client";

/* ---------- TYPES ---------- */
interface Farm {
  id: number;
  name: string;
  location: string;
  notes?: string;
}

interface Batch {
  id: number;
  farm_id: number;
  product_type: "CHICKEN" | "EGG";
  target_units: number;
  units_placed?: number;
  unit_price: number;
  feed_price: number;
  mortality_rate: number;
  expected_roi: number;
  status?: string;
}

interface DashboardStats {
  farms: number;
  batches: number;
  investments: number;
  payouts: number;
}

/* ---------- COMPONENT ---------- */
export default function AdminDashboard() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    farms: 0,
    batches: 0,
    investments: 0,
    payouts: 0,
  });

  const [farmForm, setFarmForm] = useState({ name: "", location: "", notes: "" });
  const [batchForm, setBatchForm] = useState<Batch>({
    id: 0,
    farm_id: 0,
    product_type: "CHICKEN",
    unit_price: 50,
    target_units: 1000,
    feed_price: 6,
    mortality_rate: 0.07,
    expected_roi: 0.12,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* ---------- HELPERS ---------- */
  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleError = (errMsg: string) => {
    console.error(errMsg);
    notify(errMsg);
    setLoading(false);
  };

  /* ---------- API ---------- */
  const refresh = async () => {
    setLoading(true);
    try {
      const [f, b, s] = await Promise.all([
        api.get("/admin/farms"),
        api.get("/admin/batches"),
        api.get("/admin/stats"),
      ]);
      setFarms(f.data);
      setBatches(b.data);
      setStats(s.data);
    } catch {
      handleError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  /* Farm CRUD */
  const createFarm = async () => {
    if (!farmForm.name.trim()) return notify("Farm name required.");
    setLoading(true);
    try {
      await api.post("/admin/farms", farmForm);
      setFarmForm({ name: "", location: "", notes: "" });
      notify("Farm created.");
      refresh();
    } catch {
      handleError("Failed to create farm.");
    }
  };

  const deleteFarm = async (id: number) => {
    if (!window.confirm("Delete this farm?")) return;
    setLoading(true);
    try {
      await api.delete(`/admin/farms/${id}`);
      notify("Farm deleted.");
      refresh();
    } catch {
      handleError("Failed to delete farm.");
    }
  };

  /* Batch CRUD */
  const createBatch = async () => {
    if (!batchForm.farm_id) return notify("Select a farm.");
    setLoading(true);
    try {
      await api.post("/admin/batches", { ...batchForm, farm_id: Number(batchForm.farm_id) });
      notify("Batch created.");
      refresh();
    } catch {
      handleError("Failed to create batch.");
    }
  };

  const deleteBatch = async (id: number) => {
    if (!window.confirm("Delete this batch?")) return;
    setLoading(true);
    try {
      await api.delete(`/admin/batches/${id}`);
      notify("Batch deleted.");
      refresh();
    } catch {
      handleError("Failed to delete batch.");
    }
  };

  /* Batch Actions */
  const activate = async (id: number) => {
    try {
      await api.post(`/admin/batches/${id}/activate`);
      notify("Batch activated.");
      refresh();
    } catch {
      handleError("Activation failed.");
    }
  };

  const simulate = async (id: number) => {
    try {
      const r = await api.get(`/admin/payouts/${id}/simulate`);
      alert(`Simulated total payout: GHS ${r.data.simulated_total.toFixed(2)}`);
    } catch {
      handleError("Simulation failed.");
    }
  };

  const execute = async (id: number) => {
    if (!window.confirm("Execute real payouts?")) return;
    try {
      const r = await api.post(`/admin/payouts/${id}/execute`);
      alert(`Payouts created: ${r.data.count}`);
      refresh();
    } catch {
      handleError("Execution failed.");
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-10">
      <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>

      {loading && <div className="text-slate-500">Loading…</div>}
      {message && <div className="text-blue-600">{message}</div>}

      {/* Stats */}
      <section className="p-6 bg-slate-50 rounded-lg border">
        <h2 className="font-bold mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Farms" value={stats.farms} icon="🏠" />
          <StatBox label="Batches" value={stats.batches} icon="📦" />
          <StatBox label="Investments" value={stats.investments} icon="💰" />
          <StatBox label="Payouts" value={stats.payouts} icon="🪙" />
        </div>
      </section>

      {/* Farm Form */}
      <section className="p-6 bg-white rounded shadow">
        <h2 className="font-bold mb-2">Create Farm</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <input
            className="input"
            placeholder="Name"
            value={farmForm.name}
            onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Location"
            value={farmForm.location}
            onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
          />
          <input
            className="input"
            placeholder="Notes"
            value={farmForm.notes}
            onChange={(e) => setFarmForm({ ...farmForm, notes: e.target.value })}
          />
        </div>
        <button onClick={createFarm} disabled={loading} className="btn btn-primary mt-4">
          Save Farm
        </button>
      </section>

      {/* Batch Form */}
      <section className="p-6 bg-white rounded shadow">
        <h2 className="font-bold mb-2">Create Batch</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <select
            className="input"
            value={batchForm.farm_id}
            onChange={(e) => setBatchForm({ ...batchForm, farm_id: Number(e.target.value) })}
          >
            <option value={0}>Select Farm</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={batchForm.product_type}
            onChange={(e) =>
              setBatchForm({ ...batchForm, product_type: e.target.value as "CHICKEN" | "EGG" })
            }
          >
            <option value="CHICKEN">Chicken</option>
            <option value="EGG">Egg</option>
          </select>
          <input
            type="number"
            className="input"
            placeholder="Unit Price"
            value={batchForm.unit_price}
            onChange={(e) => setBatchForm({ ...batchForm, unit_price: Number(e.target.value) })}
          />
          <input
            type="number"
            className="input"
            placeholder="Target Units"
            value={batchForm.target_units}
            onChange={(e) => setBatchForm({ ...batchForm, target_units: Number(e.target.value) })}
          />
          <input
            type="number"
            className="input"
            placeholder="Feed Price"
            value={batchForm.feed_price}
            onChange={(e) => setBatchForm({ ...batchForm, feed_price: Number(e.target.value) })}
          />
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="Mortality Rate"
            value={batchForm.mortality_rate}
            onChange={(e) => setBatchForm({ ...batchForm, mortality_rate: Number(e.target.value) })}
          />
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="Expected ROI"
            value={batchForm.expected_roi}
            onChange={(e) => setBatchForm({ ...batchForm, expected_roi: Number(e.target.value) })}
          />
        </div>
        <button onClick={createBatch} disabled={loading} className="btn btn-primary mt-4">
          Save Batch
        </button>
      </section>

      {/* Batch Table */}
      <section className="p-6 bg-white rounded shadow">
        <h2 className="font-bold mb-3">Batches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Farm</th>
                <th className="p-2">Type</th>
                <th className="p-2">Units</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">#{b.id}</td>
                  <td className="p-2">{b.farm_id}</td>
                  <td className="p-2">{b.product_type}</td>
                  <td className="p-2">
                    {b.units_placed ?? 0}/{b.target_units}
                  </td>
                  <td className="p-2">{b.status || "N/A"}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => activate(b.id)} className="btn btn-outline">
                      Activate
                    </button>
                    <button onClick={() => simulate(b.id)} className="btn btn-outline">
                      Simulate
                    </button>
                    <button onClick={() => execute(b.id)} className="btn btn-primary">
                      Execute Payout
                    </button>
                    <button onClick={() => deleteBatch(b.id)} className="btn btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips */}
      <section className="p-6 bg-yellow-50 rounded border border-yellow-200">
        <h2 className="font-bold mb-2">Admin Tips & Security</h2>
        <ul className="list-disc ml-6 text-slate-700 space-y-1">
          <li>Review farm & batch details carefully before payouts.</li>
          <li>Use simulate to estimate ROI before executing.</li>
          <li>Rotate admin credentials regularly.</li>
          <li>Contact support for suspicious activity.</li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- SMALL STAT BOX ---------- */
function StatBox({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-4 bg-white rounded shadow flex flex-col items-center">
      <span className="text-3xl mb-2">{icon}</span>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

/* ---------- GLOBAL INPUT / BUTTON CLASSES ---------- */
/* Tailwind: .input { @apply border rounded px-3 py-2 w-full } */
/* Tailwind: .btn { @apply px-4 py-2 rounded font-semibold } */
/* btn-primary, btn-outline, btn-danger styles as you prefer */
