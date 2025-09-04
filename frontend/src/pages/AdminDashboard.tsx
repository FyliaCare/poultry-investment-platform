import React, { useEffect, useState } from 'react'
import api from '../api/client'
export default function AdminDashboard() {
  const [farms, setFarms] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [farmForm, setFarmForm] = useState({ name: '', location: '', notes: '' })
  const [batchForm, setBatchForm] = useState({ farm_id: 0, product_type: 'CHICKEN', unit_price: 50, target_units: 1000, feed_price: 6, mortality_rate: 0.07, expected_roi: 0.12 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>({ farms: 0, batches: 0, investments: 0, payouts: 0 })

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const f = await api.get('/admin/farms'); setFarms(f.data)
      const b = await api.get('/admin/batches'); setBatches(b.data)
      const s = await api.get('/admin/stats'); setStats(s.data)
    } catch (e:any) { setError('Failed to load admin data.') }
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function createFarm() {
    setLoading(true)
    try {
      await api.post('/admin/farms', farmForm)
      setFarmForm({ name: '', location: '', notes: '' })
      refresh()
    } catch (e:any) { setError('Failed to create farm.') }
    setLoading(false)
  }
  async function editFarm(id:number, data:any) {
    setLoading(true)
    try {
      await api.put(`/admin/farms/${id}`, data)
      refresh()
    } catch (e:any) { setError('Failed to edit farm.') }
    setLoading(false)
  }
  async function deleteFarm(id:number) {
    setLoading(true)
    try {
      await api.delete(`/admin/farms/${id}`)
      refresh()
    } catch (e:any) { setError('Failed to delete farm.') }
    setLoading(false)
  }
  async function createBatch() {
    setLoading(true)
    try {
      await api.post('/admin/batches', { ...batchForm, farm_id: Number(batchForm.farm_id) })
      refresh()
    } catch (e:any) { setError('Failed to create batch.') }
    setLoading(false)
  }
  async function editBatch(id:number, data:any) {
    setLoading(true)
    try {
      await api.put(`/admin/batches/${id}`, data)
      refresh()
    } catch (e:any) { setError('Failed to edit batch.') }
    setLoading(false)
  }
  async function deleteBatch(id:number) {
    setLoading(true)
    try {
      await api.delete(`/admin/batches/${id}`)
      refresh()
    } catch (e:any) { setError('Failed to delete batch.') }
    setLoading(false)
  }
  async function activate(id:number) { await api.post(`/admin/batches/${id}/activate`); refresh() }
  async function simulate(id:number) { const r = await api.get(`/admin/payouts/${id}/simulate`); alert(`Simulated total payout: GHS ${r.data.simulated_total.toFixed(2)}`) }
  async function execute(id:number) { const r = await api.post(`/admin/payouts/${id}/execute`); alert(`Payouts created: ${r.data.count}`) }

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-10">
      <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <section className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="font-bold mb-2">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Farms" value={stats.farms} icon="🏠" />
          <StatBox label="Batches" value={stats.batches} icon="📦" />
          <StatBox label="Investments" value={stats.investments} icon="💰" />
          <StatBox label="Payouts" value={stats.payouts} icon="🪙" />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Create Farm</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Name" value={farmForm.name} onChange={e=>setFarmForm({...farmForm, name: e.target.value})} />
          <input className="border rounded-lg px-3 py-2" placeholder="Location" value={farmForm.location} onChange={e=>setFarmForm({...farmForm, location: e.target.value})} />
          <input className="border rounded-lg px-3 py-2" placeholder="Notes" value={farmForm.notes} onChange={e=>setFarmForm({...farmForm, notes: e.target.value})} />
        </div>
        <button onClick={createFarm} className="btn btn-primary mt-4">Save Farm</button>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Create Batch</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <select className="border rounded-lg px-3 py-2" value={batchForm.farm_id} onChange={e=>setBatchForm({...batchForm, farm_id: Number(e.target.value)})}>
            <option value={0}>Select Farm</option>
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2" value={batchForm.product_type} onChange={e=>setBatchForm({...batchForm, product_type: e.target.value})}>
            <option value="CHICKEN">Chicken</option>
            <option value="EGG">Egg</option>
          </select>
          <input type="number" className="border rounded-lg px-3 py-2" placeholder="Unit Price" value={batchForm.unit_price} onChange={e=>setBatchForm({...batchForm, unit_price: Number(e.target.value)})} />
          <input type="number" className="border rounded-lg px-3 py-2" placeholder="Target Units" value={batchForm.target_units} onChange={e=>setBatchForm({...batchForm, target_units: Number(e.target.value)})} />
          <input type="number" className="border rounded-lg px-3 py-2" placeholder="Feed Price" value={batchForm.feed_price} onChange={e=>setBatchForm({...batchForm, feed_price: Number(e.target.value)})} />
          <input type="number" step="0.01" className="border rounded-lg px-3 py-2" placeholder="Mortality Rate" value={batchForm.mortality_rate} onChange={e=>setBatchForm({...batchForm, mortality_rate: Number(e.target.value)})} />
          <input type="number" step="0.01" className="border rounded-lg px-3 py-2" placeholder="Expected ROI" value={batchForm.expected_roi} onChange={e=>setBatchForm({...batchForm, expected_roi: Number(e.target.value)})} />
        </div>
        <button onClick={createBatch} className="btn btn-primary mt-4">Save Batch</button>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Batches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Farm</th><th className="text-left p-2">Type</th><th className="text-left p-2">Units</th><th className="text-left p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">#{b.id}</td>
                  <td className="p-2">{b.farm_id}</td>
                  <td className="p-2">{b.product_type}</td>
                  <td className="p-2">{b.units_placed}/{b.target_units}</td>
                  <td className="p-2">{b.status}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={()=>activate(b.id)} className="btn btn-outline">Activate</button>
                    <button onClick={()=>simulate(b.id)} className="btn btn-outline">Simulate</button>
                    <button onClick={()=>execute(b.id)} className="btn btn-primary">Execute Payout</button>
                    <button onClick={()=>editBatch(b.id, b)} className="btn btn-outline">Edit</button>
                    <button onClick={()=>deleteBatch(b.id)} className="btn btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="font-bold mb-2">Admin Tips & Security</h2>
        <ul className="list-disc ml-6 text-slate-700 space-y-1">
          <li>Review farm and batch details before activating or executing payouts.</li>
          <li>Use the simulate feature to estimate payouts before execution.</li>
          <li>Keep sensitive admin credentials secure and change passwords regularly.</li>
          <li>Contact support for any issues or suspicious activity.</li>
        </ul>
      </section>
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="p-4 bg-white rounded shadow flex flex-col items-center">
      <span className="text-3xl mb-2">{icon}</span>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  )
}
