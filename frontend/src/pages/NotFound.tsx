import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="text-slate-600 mt-2">The page you requested does not exist.</p>
      <Link to="/" className="btn btn-primary mt-6">Go home</Link>
    </div>
  )
}
