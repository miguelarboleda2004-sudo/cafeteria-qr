import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP, formatDate } from '../../lib/utils'
import { useState } from 'react'

export default function SalesPage() {
  const [period, setPeriod] = useState('today')

  const { data: summary } = useQuery({ queryKey: ['sales-summary', period], queryFn: async () => (await adminApi.getSalesSummary(period)).data, refetchInterval: 5000 })
  const { data: sales } = useQuery({ queryKey: ['sales', period], queryFn: async () => (await adminApi.getSales()).data })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ventas & Historial</h1>

      <div className="flex gap-2">
        {['today','yesterday','week','month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-full text-sm capitalize ${period===p ? 'bg-coffee-600 text-white' : 'bg-white border'}`}>{p}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="text-sm text-gray-500">Total ventas</div>
          <div className="text-2xl font-bold text-coffee-700">{formatCOP(summary?.sales?.total_sales_cop || 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="text-sm text-gray-500">Pedidos</div>
          <div className="text-2xl font-bold">{summary?.sales?.total_orders || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="text-sm text-gray-500">Ticket promedio</div>
          <div className="text-2xl font-bold">{formatCOP(summary?.sales?.average_ticket_cop || 0)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 font-semibold">Historial de ventas (entregados)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Código</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Mesa</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Total</th><th className="text-left p-3">Método</th></tr></thead>
            <tbody>
              {sales?.orders?.map((o: any) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 text-xs">{formatDate(o.created_at)}</td>
                  <td className="p-3 font-mono text-xs font-bold">{o.public_code}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.table_id?.slice(0,4) || '-'}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{o.order_type}</span></td>
                  <td className="p-3 font-semibold">{formatCOP(o.total_cop)}</td>
                  <td className="p-3 text-xs">{o.payment_method || '-'}</td>
                </tr>
              ))}
              {sales?.orders?.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">Sin ventas en este período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
