import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../store/auth'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Portfolio() {
  const [investments, setInvestments] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>({ balance: 0 })
  const { fetchMe, user } = useAuth()

  useEffect(() => {
    fetchMe()
    api.get('/invest/wallet').then(r => setWallet(r.data))
    api.get('/invest/my').then(r => setInvestments(r.data))
  }, [])

  const chartData = investments.slice(0, 8).map((inv, i) => ({ name: `#${inv.id}`, amount: inv.amount }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-extrabold">Your Portfolio</h1>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-500">Wallet Balance</div><div className="text-2xl font-bold">GHS {wallet.balance?.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Investments</div><div className="text-2xl font-bold">{investments.length}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Auto-Reinvest</div><div className="text-2xl font-bold">Off</div></div>
      </div>

      <div className="card p-6 mt-8">
        <div className="font-bold mb-4">Investment Amounts</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3">My Investments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-200 bg-white rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Batch</th>
                <th className="text-left p-3">Units</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="p-3">#{inv.id}</td>
                  <td className="p-3">{inv.batch_id}</td>
                  <td className="p-3">{inv.units}</td>
                  <td className="p-3">GHS {inv.amount.toFixed(2)}</td>
                  <td className="p-3">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
