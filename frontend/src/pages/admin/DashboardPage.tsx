import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP } from '../../lib/utils'
import { Table2, Clock, ChefHat, PackageCheck, CreditCard, TrendingUp } from 'lucide-react'

const statusStyles: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  BROWSING: 'bg-blue-100 text-blue-800 border-blue-200',
  ORDER_PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await adminApi.getDashboard()
      return res.data
    },
    refetchInterval: 5000
  })

  if (isLoading) return <div className="p-6">Cargando dashboard...</div>
  if (error) return <div className="p-6 text-red-600">Error al cargar. Verifica que el backend esté corriendo y hayas hecho login.</div>

  const tablesSummary = data.tables_summary
  const ordersSummary = data.orders_summary

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Table2 size={16} /> Mesas</div>
          <div className="text-2xl font-bold mt-1">{tablesSummary.total}</div>
          <div className="text-xs text-gray-500 mt-1">{tablesSummary.available} disponibles • {tablesSummary.total - tablesSummary.available} ocupadas</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Clock size={16} /> Pendientes pago</div>
          <div className="text-2xl font-bold mt-1">{ordersSummary.pending_payment}</div>
          <div className="text-xs text-amber-600">Requieren cobro en caja</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500"><ChefHat size={16} /> En preparación</div>
          <div className="text-2xl font-bold mt-1">{ordersSummary.preparing}</div>
          <div className="text-xs text-orange-600">En cocina</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500"><PackageCheck size={16} /> Listos</div>
          <div className="text-2xl font-bold mt-1">{ordersSummary.ready}</div>
          <div className="text-xs text-emerald-600">Para entregar</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp size={18} /> Ventas hoy</h3>
          <div className="text-3xl font-bold text-coffee-700 mt-2">{formatCOP(ordersSummary.sales_today_cop)}</div>
          <div className="text-sm text-gray-500">{ordersSummary.delivered_today} pedidos entregados hoy</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <h3 className="font-semibold flex items-center gap-2"><CreditCard size={16} /> Resumen rápido</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Pend. pago</span><span className="font-bold">{ordersSummary.pending_payment}</span></div>
            <div className="flex justify-between"><span>Pagados</span><span className="font-bold">{ordersSummary.paid}</span></div>
            <div className="flex justify-between"><span>Preparando</span><span className="font-bold">{ordersSummary.preparing}</span></div>
            <div className="flex justify-between"><span>Listos</span><span className="font-bold">{ordersSummary.ready}</span></div>
          </div>
        </div>
      </div>

      {/* Tables map */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Mapa de mesas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.tables.map((t: any) => (
            <div key={t.id} className={`p-4 rounded-2xl border-2 ${statusStyles[t.status] || 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">{t.name}</span>
                <span className="text-xs px-2 py-1 bg-white rounded-full border">{t.status}</span>
              </div>
              <div className="text-xs mt-1 opacity-80">#{t.number} • {t.public_code.slice(0,6)}</div>
              {t.active_order ? (
                <div className="mt-3 bg-white rounded-xl p-2 text-xs">
                  <div className="font-semibold truncate">{t.active_order.customer_name}</div>
                  <div className="text-gray-600">{t.active_order.public_code}</div>
                  <div className="font-bold text-coffee-700">{formatCOP(t.active_order.total_cop)}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">{t.active_order.status}</span>
                </div>
              ) : (
                <div className="mt-3 text-xs opacity-70">Sin pedido activo</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
