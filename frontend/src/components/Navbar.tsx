import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
export default function Navbar() {
  const { isAuthed, logout, user } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-extrabold text-xl">🐣 PoultryYield</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/how-it-works" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>How it works</NavLink>
          <NavLink to="/faq" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>FAQ</NavLink>
          <NavLink to="/invest/eggs" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>Eggs</NavLink>
          <NavLink to="/invest/chicken" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>Chicken</NavLink>
          {isAuthed && <NavLink to="/portfolio" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>Portfolio</NavLink>}
          {isAuthed && user?.is_admin && <NavLink to="/admin" className={({isActive}) => isActive ? 'text-brand-600' : 'text-slate-700'}>Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          {!isAuthed ? (
            <>
              <Link to="/login" className="btn btn-outline">Log in</Link>
              <Link to="/register" className="btn btn-primary">Get started</Link>
            </>
          ) : (
            <>
              <span className="hidden md:inline text-sm text-slate-600 mr-2">Hi, {user?.full_name || 'Investor'}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="btn btn-outline">Log out</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
