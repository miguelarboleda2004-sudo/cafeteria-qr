import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Table2, Package, Tag, ClipboardList, CreditCard, ChefHat, BarChart3, LogOut, Coffee, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('dev-role')
    if (!token) {
      navigate('/admin/login')
    } else {
      const email = localStorage.getItem('user-email') || 'Admin'
      setUserEmail(email)
    }
    // Check supabase session
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) setUserEmail(data.session.user.email)
      })
    }
  }, [navigate])

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('dev-role')
    navigate('/admin/login')
  }

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/tables', label: 'Mesas', icon: Table2 },
    { to: '/admin/products', label: 'Productos', icon: Package },
    { to: '/admin/categories', label: 'Categorías', icon: Tag },
    { to: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
    { to: '/admin/cashier', label: 'Caja', icon: CreditCard },
    { to: '/admin/kitchen', label: 'Cocina', icon: ChefHat },
    { to: '/admin/sales', label: 'Ventas', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-sm transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-3 px-6 border-b">
            <div className="w-9 h-9 bg-coffee-600 rounded-lg flex items-center justify-center text-white">
              <Coffee size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-coffee-900">Café Aroma</div>
              <div className="text-xs text-gray-500">Panel Admin</div>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-coffee-50 text-coffee-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSidebarOpen(false)}>
                <l.icon size={18} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="text-sm font-medium truncate">{userEmail}</div>
            <button onClick={logout} className="mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-700"><LogOut size={16} /> Cerrar sesión</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        <header className="h-16 bg-white border-b flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <h1 className="font-semibold text-gray-800">Gestión Cafetería QR</h1>
          <div className="ml-auto text-sm text-gray-500 hidden sm:block">Vercel + Render + Supabase</div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
