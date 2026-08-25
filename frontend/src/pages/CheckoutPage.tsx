import { useState } from 'react'
import { useCartStore } from '../store/cartStore'
import { publicApi } from '../services/api'
import { formatCOP } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, ShoppingBag } from 'lucide-react'

export default function CheckoutPage() {
  const { items, total, tableCode, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const incompatible = orderType === 'TAKEAWAY' ? items.filter(i => !i.product.allow_takeaway) : items.filter(i => !i.product.allow_dine_in)

  const submit = async () => {
    if (!customerName.trim()) { setError('Ingresa tu nombre'); return }
    if (!tableCode) { setError('No se detectó mesa. Escanea el QR nuevamente.'); return }
    if (incompatible.length > 0) { setError(`Producto no compatible: ${incompatible.map(i => i.product.name).join(', ')}`); return }
    setLoading(true)
    setError('')
    try {
      const res = await publicApi.createOrder({
        table_code: tableCode,
        customer_name: customerName.trim(),
        order_type: orderType,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
      })
      const public_code = res.data.public_code
      clearCart()
      navigate(`/order/${public_code}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al crear pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-10">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3 lg:max-w-2xl">
          <button onClick={() => navigate('/cart')} className="w-9 h-9 rounded-full border flex items-center justify-center"><ArrowLeft size={18} /></button>
          <h1 className="font-bold text-lg">Confirmar pedido</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 lg:max-w-2xl">
        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <label className="text-sm font-semibold">Tu nombre *</label>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej: Miguel" className="mt-2 w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500" />
        </div>

        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <label className="text-sm font-semibold">¿Cómo deseas tu pedido?</label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => setOrderType('DINE_IN')} className={`p-4 rounded-xl border-2 text-center ${orderType === 'DINE_IN' ? 'border-coffee-600 bg-coffee-50' : 'border-gray-200'}`}>
              <Store className="mx-auto text-coffee-600" />
              <div className="font-semibold text-sm mt-1">En el local</div>
              <div className="text-xs text-gray-500">Mesa {tableCode?.slice(0,6)}</div>
            </button>
            <button onClick={() => setOrderType('TAKEAWAY')} className={`p-4 rounded-xl border-2 text-center ${orderType === 'TAKEAWAY' ? 'border-coffee-600 bg-coffee-50' : 'border-gray-200'}`}>
              <ShoppingBag className="mx-auto text-coffee-600" />
              <div className="font-semibold text-sm mt-1">Para llevar</div>
              <div className="text-xs text-gray-500">Recoge en caja</div>
            </button>
          </div>
          {incompatible.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠️ No puedes pedir para llevar: {incompatible.map(i => i.product.name).join(', ')} — cambia a "En el local" o quítalos del carrito.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <h3 className="font-semibold">Resumen</h3>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span>{product.name} x{quantity}</span>
              <span className="font-medium">{formatCOP(product.price_cop * quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg pt-3"><span>Total</span><span className="text-coffee-700">{formatCOP(total())}</span></div>
          <p className="text-xs text-gray-500 mt-1">Mesa: {tableCode}</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

        <button onClick={submit} disabled={loading || incompatible.length > 0} className="w-full bg-coffee-600 disabled:bg-gray-300 text-white py-4 rounded-full font-bold text-lg">
          {loading ? 'Creando pedido...' : `Confirmar pedido • ${formatCOP(total())}`}
        </button>
        <p className="text-xs text-center text-gray-500">Al confirmar, recibirás un código para pagar en caja. Estado inicial: Pendiente de pago.</p>
      </div>
    </div>
  )
}
