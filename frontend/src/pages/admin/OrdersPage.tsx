import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP, formatDate } from '../../lib/utils'
import { useState } from 'react'

const statuses = ['PENDING_PAYMENT','PAID','PREPARING','READY','DELIVERED','CANCELLED']

export default function OrdersPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const { data } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async () => (await adminApi.listOrders(filter ? { status: filter } : {})).data,
    refetchInterval: 5000
  })

  const openOrder = async (id: string) => {
    const res = await adminApi.getOrder(id)
    setSelected(res.data)
  }

  const actionMut = useMutation({
    mutationFn: async ({ id, action, payload }: any) => {
      if (action === 'pay') return (await adminApi.payOrder(id, payload)).data
      if (action === 'prep') return (await adminApi.startPrep(id)).data
      if (action === 'ready') return (await adminApi.ready(id)).data
      if (action === 'deliver') return (await adminApi.deliver(id)).data
      if (action === 'cancel') return (await adminApi.cancel(id)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setSelected(null) }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${!filter ? 'bg-coffee-600 text-white' : 'bg-white border'}`}>Todos</button>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === s ? 'bg-coffee-600 text-white' : 'bg-white border'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="text-left p-3">Código</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Mesa</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Total</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Fecha</th><th className="text-left p-3"></th></tr>
            </thead>
            <tbody>
              {data?.map((o: any) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-xs">{o.public_code}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.table_name || '-'} #{o.table_number || ''}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{o.order_type === 'TAKEAWAY' ? 'Llevar' : 'Local'}</span></td>
                  <td className="p-3 font-semibold">{formatCOP(o.total_cop)}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 bg-amber-100 rounded-full">{o.status}</span></td>
                  <td className="p-3 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                  <td className="p-3"><button onClick={() => openOrder(o.id)} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs">Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{selected.public_code} • {selected.customer_name}</h3>
            <p className="text-sm text-gray-500">{selected.table_name} • {selected.order_type} • {selected.status}</p>
            <div className="mt-4 space-y-2">
              {selected.items.map((it: any) => (
                <div key={it.id} className="flex justify-between text-sm py-2 border-b"><span>{it.product_name} x{it.quantity}</span><span>{formatCOP(it.subtotal_cop)}</span></div>
              ))}
              <div className="flex justify-between font-bold pt-2"><span>Total</span><span>{formatCOP(selected.total_cop)}</span></div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-sm">Historial</h4>
              <div className="text-xs space-y-1 mt-1">
                {selected.history.map((h: any) => (
                  <div key={h.id} className="flex justify-between text-gray-600"><span>{h.previous_status || '—'} → {h.new_status}</span><span>{formatDate(h.created_at)}</span></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-6">
              <button onClick={() => actionMut.mutate({ id: selected.id, action: 'pay', payload: { payment_method: 'CASH' } })} className="bg-green-600 text-white py-2 rounded-xl text-sm font-medium">Registrar pago (CASH)</button>
              <button onClick={() => actionMut.mutate({ id: selected.id, action: 'prep' })} className="bg-blue-600 text-white py-2 rounded-xl text-sm font-medium">Iniciar preparación</button>
              <button onClick={() => actionMut.mutate({ id: selected.id, action: 'ready' })} className="bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium">Marcar listo</button>
              <button onClick={() => actionMut.mutate({ id: selected.id, action: 'deliver' })} className="bg-coffee-600 text-white py-2 rounded-xl text-sm font-medium">Entregar</button>
              <button onClick={() => actionMut.mutate({ id: selected.id, action: 'cancel' })} className="bg-red-600 text-white py-2 rounded-xl text-sm font-medium col-span-2">Cancelar</button>
            </div>
            <button onClick={() => setSelected(null)} className="mt-4 w-full border py-2 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
