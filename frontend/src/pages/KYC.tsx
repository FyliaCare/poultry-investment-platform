export default function KYC() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-extrabold">KYC Verification</h1>
      <p className="mt-2 text-slate-700">For demo, KYC is simplified. In production, collect ID, selfie, and address verification.</p>
      <div className="card p-6 mt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Legal name" />
          <input className="border rounded-lg px-3 py-2" placeholder="Phone number" />
          <input className="border rounded-lg px-3 py-2" placeholder="ID type" />
          <input className="border rounded-lg px-3 py-2" placeholder="ID number" />
        </div>
        <button className="btn btn-primary mt-4">Submit</button>
      </div>
    </div>
  )
}
