import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import AuthNavbar from './components/AuthNavbar'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import HomePage from './pages/HomePage'
import DetailsPage from './pages/DetailsPage'
import DemoPage from './pages/DemoPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { MHApi } from './services/api'

function FallbackRoute() {
  const location = useLocation()
  const isLegacyHtml = location.pathname.toLowerCase().endsWith('.html')

  useEffect(() => {
    if (isLegacyHtml) {
      const path = location.pathname + location.search + location.hash
      window.location.replace(path)
    }
  }, [isLegacyHtml, location])

  if (isLegacyHtml) return null
  return <Navigate to="/" replace />
}

function RoleGuard({ roles, children }) {
  const location = useLocation()
  let user = null
  try { user = MHApi.getUser() } catch { user = null }
  if (!user) return <Navigate to={`/login.html?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (roles && !roles.includes(user.role)) {
    const dest = user.role === 'admin' ? '/admin-dashboard.html' : user.role === 'owner' ? '/owner-dashboard.html' : '/student-dashboard.html'
    return <Navigate to={dest} replace />
  }
  return children
}

function HomeLayout() {
  return (
    <>
      <Navbar
        brandHref="/index.html"
        navLinks={[
          { href: '#search-section', label: 'Search' },
          { href: '#explore', label: 'Listings' },
          { href: '#how', label: 'How It Works' },
        ]}
      />
      <HomePage />
      <Footer />
    </>
  )
}

function DetailsLayout() {
  return (
    <>
      <Navbar
        brandHref="/index.html"
        navLinks={[
          { href: '/index.html', label: 'Home' },
          { href: '/index.html#explore', label: 'Explore' },
        ]}
      />
      <DetailsPage />
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/assets/logo.svg" alt="MessHunt" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span className="brand-name">Mess<span>Hunt</span></span>
          </div>
          <p>Find Your Perfect Mess</p>
        </div>
        <div className="footer-bottom">© 2026 MessHunt • Contact: <a className="inline-link" href="mailto:studentmesshunt@gmail.com">studentmesshunt@gmail.com</a></div>
      </footer>
    </>
  )
}

function DemoLayout() {
  return (
    <>
      <Navbar
        brandHref="/index.html"
        navLinks={[
          { href: '/index.html', label: 'Home' },
          { href: '/index.html#explore', label: 'Real Listings' },
        ]}
      />
      <DemoPage />
      <Footer />
    </>
  )
}

function DashboardLayout({ navLinks, children }) {
  return (
    <>
      <Navbar brandHref="/index.html" navLinks={navLinks} />
      {children}
    </>
  )
}

function LoginLayout() {
  return (
    <>
      <AuthNavbar rightLink="/register.html" rightLabel="Register" />
      <LoginPage />
    </>
  )
}

function RegisterLayout() {
  return (
    <>
      <AuthNavbar rightLink="/login.html" rightLabel="Login" />
      <RegisterPage />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LoginModal />
      <Routes>
        <Route path="/" element={<HomeLayout />} />
        <Route path="/index.html" element={<HomeLayout />} />

        <Route path="/details" element={<DetailsLayout />} />
        <Route path="/details.html" element={<DetailsLayout />} />

        <Route path="/demo" element={<DemoLayout />} />
        <Route path="/demo.html" element={<DemoLayout />} />

        <Route path="/login" element={<LoginLayout />} />
        <Route path="/login.html" element={<LoginLayout />} />

        <Route path="/register" element={<RegisterLayout />} />
        <Route path="/register.html" element={<RegisterLayout />} />

        <Route path="/student-dashboard" element={<RoleGuard roles={['student']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }, { href: '/index.html#explore', label: 'Explore' }]}><StudentDashboard /></DashboardLayout></RoleGuard>} />
        <Route path="/student-dashboard.html" element={<RoleGuard roles={['student']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }, { href: '/index.html#explore', label: 'Explore' }]}><StudentDashboard /></DashboardLayout></RoleGuard>} />

        <Route path="/owner-dashboard" element={<RoleGuard roles={['owner']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }]}><OwnerDashboard /></DashboardLayout></RoleGuard>} />
        <Route path="/owner-dashboard.html" element={<RoleGuard roles={['owner']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }]}><OwnerDashboard /></DashboardLayout></RoleGuard>} />

        <Route path="/admin-dashboard" element={<RoleGuard roles={['admin']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }]}><AdminDashboard /></DashboardLayout></RoleGuard>} />
        <Route path="/admin-dashboard.html" element={<RoleGuard roles={['admin']}><DashboardLayout navLinks={[{ href: '/index.html', label: 'Home' }]}><AdminDashboard /></DashboardLayout></RoleGuard>} />

        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
