import { useCartStore } from '../store/cartStore'
import { formatCOP } from '../lib/utils'
import { Minus, Plus, Trash2, ArrowLeft, Coffee } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, tableCode } = useCartStore()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <Coffee size={48} className="text-gray-300" />
        <h2 className="font-bold text-xl mt-4">Tu carrito está vacío</h2>
        <p className="text-sm text-gray-500 mt-1">Agrega productos desde el menú</p>
        <button onClick={() => navigate(tableCode ? `/menu/${tableCode}` : '/')} className="mt-6 bg-coffee-600 text-white px-6 py-3 rounded-full font-semibold">Volver al menú</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3 lg:max-w-2xl">
          <button onClick={() => navigate(tableCode ? `/menu/${tableCode}` : '/')} className="w-9 h-9 rounded-full border flex items-center justify-center"><ArrowLeft size={18} /></button>
          <h1 className="font-bold text-lg">Tu pedido</h1>
          <span className="ml-auto text-sm text-gray-500">{items.reduce((s, i) => s + i.quantity, 0)} items</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3 lg:max-w-2xl">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="bg-white rounded-2xl p-3 flex gap-3 border shadow-sm">
            <img src={product.image_url || `https://picsum.photos/seed/${product.id}/200/200`} className="w-20 h-20 rounded-xl object-cover" alt={product.name} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-xs text-gray-500">{formatCOP(product.price_cop)} c/u</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-8 h-8 rounded-full bg-coffee-600 text-white flex items-center justify-center"><Plus size={14} /></button>
                </div>
                <div className="text-right">
                  <div className="font-bold text-coffee-700">{formatCOP(product.price_cop * quantity)}</div>
                  <button onClick={() => removeItem(product.id)} className="text-xs text-red-500 flex items-center gap-1 mt-1"><Trash2 size={12} /> Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4 border shadow-sm">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCOP(total())}</span></div>
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span>Total</span><span className="text-coffee-700">{formatCOP(total())}</span></div>
          <p className="text-xs text-gray-500 mt-2">Pagarás en caja. El total se recalcula en el servidor para evitar errores.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto lg:max-w-2xl">
          <button onClick={() => navigate('/checkout')} className="w-full bg-coffee-600 text-white py-3.5 rounded-full font-bold text-center">Continuar • {formatCOP(total())}</button>
          <button onClick={() => navigate(tableCode ? `/menu/${tableCode}` : '/')} className="w-full mt-2 text-sm text-gray-600">Seguir pidiendo</button>
        </div>
      </div>
    </div>
  )
}
