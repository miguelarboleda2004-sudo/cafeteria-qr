import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../services/api'
import { formatCOP, formatDate } from '../lib/utils'
import { CheckCircle, Clock, Coffee, CreditCard, ChefHat, PackageCheck } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, desc: 'Dirígete a la caja para realizar el pago.' },
  PAID: { label: 'Pagado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard, desc: 'Pago registrado. En preparación pronto.' },
  PREPARING: { label: 'En preparación', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: ChefHat, desc: 'El personal está preparando tu pedido.' },
  READY: { label: 'Listo para entregar', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: PackageCheck, desc: '¡Tu pedido está listo! Pásalo a recoger.' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, desc: 'Pedido entregado. ¡Gracias por tu visita!' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: Clock, desc: 'Pedido cancelado.' },
}

export default function ReceiptPage() {
  const { publicCode } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', publicCode],
    queryFn: async () => {
      const res = await publicApi.getOrder(publicCode!)
      return res.data
    },
    enabled: !!publicCode,
    refetchInterval: 5000
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-cream">Cargando recibo...</div>
  if (error || !data) return <div className="min-h-screen flex items-center justify-center bg-cream p-6"><div className="bg-white p-8 rounded-2xl text-center">Pedido no encontrado</div></div>

  const cfg = statusConfig[data.status] || statusConfig.PENDING_PAYMENT
  const Icon = cfg.icon

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      <div className="max-w-md mx-auto space-y-4 lg:max-w-lg">
        <div className="bg-white rounded-2xl p-6 border shadow-sm text-center">
          <div className="w-12 h-12 bg-coffee-600 rounded-xl flex items-center justify-center text-white mx-auto"><Coffee size={20} /></div>
          <h1 className="font-display font-bold text-xl mt-3">Café Aroma</h1>
          <p className="text-xs text-gray-500">Recibo digital</p>
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.color}`}>
            <Icon size={16} /> {cfg.label}
          </div>
          <p className="text-sm mt-2 text-gray-600">{cfg.desc}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Pedido</span><span className="font-mono font-bold">{data.public_code}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Cliente</span><span className="font-medium">{data.customer_name}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Mesa</span><span>{data.table_name || '-'} {data.table_number ? `(#${data.table_number})` : ''}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Tipo</span><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">{data.order_type === 'TAKEAWAY' ? 'Para llevar' : 'En el local'}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Fecha</span><span>{formatDate(data.created_at)}</span></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold mb-3">Productos</h3>
          {data.items.map((it: any) => (
            <div key={it.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <div className="font-medium">{it.product_name}</div>
                <div className="text-xs text-gray-500">{formatCOP(it.unit_price_cop)} x {it.quantity}</div>
              </div>
              <div className="font-semibold">{formatCOP(it.subtotal_cop)}</div>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg pt-3"><span>Total</span><span className="text-coffee-700">{formatCOP(data.total_cop)}</span></div>
        </div>

        {data.status === 'PENDING_PAYMENT' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <div className="font-bold text-amber-900">Dirígete a la caja para pagar</div>
            <p className="text-sm text-amber-800 mt-1">Muestra este código: <span className="font-mono font-bold">{data.public_code}</span></p>
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/" className="flex-1 bg-white border py-3 rounded-full text-center font-medium">Inicio</Link>
          <button onClick={() => window.location.reload()} className="flex-1 bg-coffee-600 text-white py-3 rounded-full font-semibold">Actualizar estado</button>
        </div>
        <p className="text-xs text-center text-gray-400">Actualización automática cada 5s</p>
      </div>
    </div>
  )
}
