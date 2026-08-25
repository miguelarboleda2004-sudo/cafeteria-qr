import { useCartStore } from '../store/cartStore'
import { formatCOP } from '../lib/utils'
import { ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BottomBar() {
  const { count, total, items } = useCartStore()
  const navigate = useNavigate()
  if (items.length === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex items-center justify-between z-40 lg:max-w-md lg:mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-coffee-600 text-white rounded-full flex items-center justify-center font-bold">{count()}</div>
        <div>
          <div className="text-sm font-semibold">{count()} productos</div>
          <div className="text-coffee-600 font-bold">{formatCOP(total())}</div>
        </div>
      </div>
      <button onClick={() => navigate('/cart')} className="bg-coffee-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2">
        <ShoppingBag size={18} /> Ver carrito
      </button>
    </div>
  )
}
