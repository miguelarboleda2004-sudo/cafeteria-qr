import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP, formatDate } from '../../lib/utils'
import { useState } from 'react'

export default function CashierPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<any>(null)
  const [method, setMethod] = useState('CASH')
  const [ref, setRef] = useState('')

  const { data } = useQuery({
    queryKey: ['cashier-orders'],
    queryFn: async () => (await adminApi.listOrders({ status: 'PENDING_PAYMENT' })).data,
    refetchInterval: 4000
  })

  const payMut = useMutation({
    mutationFn: async () => (await adminApi.payOrder(selected.id, { payment_method: method, reference: ref || null })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cashier-orders'] }); setSelected(null); setRef('') }
  })

  const open = async (id: string) => {
    const res = await adminApi.getOrder(id)
    setSelected(res.data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caja — Pedidos pendientes de pago</h1>
      <p className="text-sm text-gray-600">Registra el pago para mover el pedido a preparación. Estado inicial: PENDING_PAYMENT.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.length === 0 && <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-2xl border">No hay pedidos pendientes 🎉</div>}
        {data?.map((o: any) => (
          <div key={o.id} className="bg-white p-5 rounded-2xl border shadow-sm">
            <div className="flex justify-between">
              <div className="font-mono font-bold text-sm">{o.public_code}</div>
              <span className="text-xs px-2 py-1 bg-amber-100 rounded-full">PENDING</span>
            </div>
            <div className="font-semibold mt-1">{o.customer_name} • Mesa {o.table_number}</div>
            <div className="text-xs text-gray-500">{formatDate(o.created_at)} • {o.order_type === 'TAKEAWAY' ? 'Para llevar' : 'Local'}</div>
            <div className="mt-3 bg-gray-50 p-3 rounded-xl text-xs">
              {/* items count placeholder */}
              <div className="font-bold text-lg text-coffee-700">{formatCOP(o.total_cop)}</div>
              <div className="text-gray-600">{o.items_count} productos</div>
            </div>
            <button onClick={() => open(o.id)} className="mt-3 w-full bg-coffee-600 text-white py-2 rounded-xl font-medium">Registrar pago</button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{selected.public_code}</h3>
            <div className="text-sm text-gray-600">{selected.customer_name} • Mesa {selected.table_number} • {selected.order_type}</div>
            <div className="mt-3 space-y-1">
              {selected.items.map((it: any) => <div key={it.id} className="flex justify-between text-sm"><span>{it.product_name} x{it.quantity}</span><span>{formatCOP(it.subtotal_cop)}</span></div>)}
              <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>{formatCOP(selected.total_cop)}</span></div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium">Método de pago</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="CASH">Efectivo (CASH)</option>
                <option value="CARD">Tarjeta (CARD)</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Referencia opcional" className="w-full mt-3 px-3 py-2 border rounded-xl" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="flex-1 border py-2 rounded-xl">Cancelar</button>
              <button onClick={() => payMut.mutate()} disabled={payMut.isPending} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50">{payMut.isPending ? 'Registrando...' : 'Confirmar pago'}</button>
            </div>
            {payMut.isError && <div className="text-sm text-red-600 mt-2">{(payMut.error as any)?.response?.data?.detail}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
