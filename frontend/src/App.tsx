import { Route, Routes, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import FAQ from './pages/FAQ'
import InvestEggs from './pages/InvestEggs'
import InvestChicken from './pages/InvestChicken'
import Portfolio from './pages/Portfolio'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import KYC from './pages/KYC'
import NotFound from './pages/NotFound'
import Risk from './pages/Risk'
import Terms from './pages/Terms'
import { useAuth } from './store/auth'

export default function App() {
  const { isAuthed } = useAuth()
  const PrivateRoute = ({ children }: { children: JSX.Element }) => (isAuthed ? children : <Navigate to="/login" replace />)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/invest/eggs" element={<InvestEggs />} />
          <Route path="/invest/chicken" element={<InvestChicken />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
