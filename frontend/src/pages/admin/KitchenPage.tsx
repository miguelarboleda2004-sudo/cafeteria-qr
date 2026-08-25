import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP, formatDate } from '../../lib/utils'

export default function KitchenPage() {
  const qc = useQueryClient()

  const { data: paid } = useQuery({ queryKey: ['kitchen-paid'], queryFn: async () => (await adminApi.listOrders({ status: 'PAID' })).data, refetchInterval: 4000 })
  const { data: preparing } = useQuery({ queryKey: ['kitchen-preparing'], queryFn: async () => (await adminApi.listOrders({ status: 'PREPARING' })).data, refetchInterval: 4000 })
  const { data: ready } = useQuery({ queryKey: ['kitchen-ready'], queryFn: async () => (await adminApi.listOrders({ status: 'READY' })).data, refetchInterval: 4000 })

  const mut = useMutation({
    mutationFn: async ({ id, action }: any) => {
      if (action === 'prep') return (await adminApi.startPrep(id)).data
      if (action === 'ready') return (await adminApi.ready(id)).data
      if (action === 'deliver') return (await adminApi.deliver(id)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kitchen-paid'] }); qc.invalidateQueries({ queryKey: ['kitchen-preparing'] }); qc.invalidateQueries({ queryKey: ['kitchen-ready'] }) }
  })

  const Column = ({ title, orders, actionLabel, action, color }: any) => (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className={`font-bold flex items-center gap-2 ${color}`}>{title} <span className="ml-auto bg-gray-100 px-2 py-0.5 rounded-full text-xs">{orders?.length || 0}</span></h3>
      <div className="space-y-3 mt-4">
        {orders?.length === 0 && <div className="text-sm text-gray-400 text-center py-6">Vacío</div>}
        {orders?.map((o: any) => (
          <div key={o.id} className="border rounded-xl p-3">
            <div className="font-mono font-bold text-xs">{o.public_code}</div>
            <div className="font-semibold text-sm">{o.customer_name} • Mesa {o.table_number} • {o.order_type === 'TAKEAWAY' ? 'Llevar' : 'Local'}</div>
            <div className="text-xs text-gray-500">{formatDate(o.created_at)} • {formatCOP(o.total_cop)}</div>
            <OrderDetail id={o.id} />
            {action && <button onClick={() => mut.mutate({ id: o.id, action })} className="mt-3 w-full bg-gray-900 text-white py-1.5 rounded-lg text-sm font-medium">{actionLabel}</button>}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cocina / Preparación</h1>
      <div className="grid lg:grid-cols-3 gap-4">
        <Column title="Pagados" orders={paid} action="prep" actionLabel="Iniciar preparación" color="text-blue-600" />
        <Column title="En preparación" orders={preparing} action="ready" actionLabel="Marcar listo" color="text-orange-600" />
        <Column title="Listos" orders={ready} action="deliver" actionLabel="Marcar entregado" color="text-emerald-600" />
      </div>
    </div>
  )
}

function OrderDetail({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ['order-detail', id], queryFn: async () => (await adminApi.getOrder(id)).data })
  if (!data) return null
  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-2">
      {data.items.map((it: any) => <div key={it.id} className="text-xs flex justify-between"><span>{it.product_name} x{it.quantity}</span><span>{formatCOP(it.subtotal_cop)}</span></div>)}
    </div>
  )
}
