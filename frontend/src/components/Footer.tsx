import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-extrabold text-xl mb-2">🐣 PoultryYield</div>
          <p className="text-sm text-slate-600">Turn everyday protein demand into transparent, real‑world yield.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Navigate</div>
          <ul className="space-y-1 text-sm text-slate-600">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/admin">Admin Dashboard</Link></li>
            <li><Link to="/login">Login</Link> / <Link to="/register">Register</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Products</div>
          <ul className="space-y-1 text-sm text-slate-600">
            <li><Link to="/invest/eggs">Egg Note (Layers)</Link></li>
            <li><Link to="/invest/chicken">Chicken Note (Broilers)</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-1 text-sm text-slate-600">
            <li><Link to="/risk">Risk Disclosure</Link></li>
            <li><Link to="/terms">Terms & Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 pb-6">© {new Date().getFullYear()} PoultryYield. All rights reserved.</div>
    </footer>
  )
}
