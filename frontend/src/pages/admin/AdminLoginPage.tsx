import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Coffee, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session?.access_token) {
          localStorage.setItem('sb-access-token', data.session.access_token)
          localStorage.setItem('user-email', data.user?.email || email)
          navigate('/admin')
          return
        }
      }
      throw new Error('Supabase no configurado. Usa modo desarrollo.')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = () => {
    localStorage.setItem('dev-role', 'ADMIN')
    localStorage.setItem('user-email', 'dev@cafeteria.local (DEV)')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-coffee-600 rounded-2xl flex items-center justify-center text-white mx-auto"><Coffee size={24} /></div>
          <h1 className="font-display font-bold text-2xl mt-3">Café Aroma</h1>
          <p className="text-sm text-gray-600">Panel Administrativo</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="font-semibold flex items-center gap-2"><Shield size={18} /> Iniciar sesión</h2>
          <p className="text-xs text-gray-500 mt-1">Usa Supabase Auth. En desarrollo puedes usar "Modo DEV".</p>

          <form onSubmit={handleSupabaseLogin} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@cafeteria.com" className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500" />
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-coffee-600 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Ingresando...' : 'Ingresar con Supabase'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <button onClick={handleDevLogin} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-medium">Entrar en modo DEV (sin Supabase)</button>
            <p className="text-xs text-center text-gray-500 mt-2">Solo para desarrollo local. Usa cabecera X-Dev-Role.</p>
          </div>

          <Link to="/" className="block text-center text-sm text-gray-600 mt-4 hover:text-coffee-600">← Volver al inicio</Link>
        </div>

        <div className="mt-4 bg-white rounded-xl p-3 border text-xs text-gray-600">
          <strong>Configurar Supabase:</strong> crea un usuario en Authentication y asigna role ADMIN en app_metadata. Variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. Backend valida JWT con SUPABASE_JWT_SECRET.
        </div>
      </div>
    </div>
  )
}
