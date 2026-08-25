import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../services/api'
import { useCartStore } from '../store/cartStore'
import { formatCOP } from '../lib/utils'
import { Coffee, ShoppingBag, Minus, Plus, Search } from 'lucide-react'
import BottomBar from '../components/BottomBar'

export default function MenuPage() {
  const { tableCode } = useParams()
  const navigate = useNavigate()
  const { addItem, setTableCode, items } = useCartStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['menu', tableCode],
    queryFn: async () => {
      const res = await publicApi.getMenu(tableCode!)
      return res.data
    },
    enabled: !!tableCode,
    retry: false
  })

  useEffect(() => {
    if (tableCode) setTableCode(tableCode)
  }, [tableCode, setTableCode])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-cream"><div className="animate-pulse text-coffee-600">Cargando menú...</div></div>
  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">!</div>
          <h2 className="font-bold text-xl mt-4">QR inválido</h2>
          <p className="text-sm text-gray-600 mt-2">El código de mesa no existe, está inactivo o expiró. Solicita ayuda al personal.</p>
          <button onClick={() => navigate('/')} className="mt-6 bg-coffee-600 text-white px-6 py-2 rounded-full">Volver al inicio</button>
        </div>
      </div>
    )
  }

  const table = data?.table
  const categories = data?.categories || []
  const products = data?.products || []

  const filtered = products.filter((p: any) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3 lg:max-w-2xl">
          <div className="w-9 h-9 bg-coffee-600 rounded-lg flex items-center justify-center text-white"><Coffee size={18} /></div>
          <div>
            <div className="font-display font-bold text-coffee-900">Café Aroma</div>
            <div className="text-xs text-gray-500">Mesa {table?.number} • {table?.name} • {table?.status}</div>
          </div>
          <button onClick={() => navigate('/cart')} className="ml-auto relative bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center">
            <ShoppingBag size={18} />
            {items.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{items.reduce((s, i) => s + i.quantity, 0)}</span>}
          </button>
        </div>
        {/* Search & categories */}
        <div className="max-w-md mx-auto px-4 pb-3 lg:max-w-2xl">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cappuccino, brownie..." className="w-full pl-9 pr-3 py-2.5 rounded-full border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === 'all' ? 'bg-coffee-600 text-white' : 'bg-white border'}`}>Todos</button>
            {categories.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === c.id ? 'bg-coffee-600 text-white' : 'bg-white border'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-md mx-auto px-4 py-4 lg:max-w-2xl">
        <div className="grid gap-4">
          {filtered.length === 0 && <div className="text-center py-10 text-gray-500">No hay productos en esta categoría</div>}
          {filtered.map((p: any) => {
            const inCart = items.find(i => i.product.id === p.id)
            return (
              <div key={p.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border">
                <img src={p.image_url || `https://picsum.photos/seed/${p.id}/200/200`} alt={p.name} className="w-24 h-24 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 leading-tight">{p.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{p.category_name}</span>
                    {!p.is_available && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Agotado</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-coffee-700">{formatCOP(p.price_cop)}</span>
                    {!p.is_available ? (
                      <span className="text-xs text-gray-400">No disponible</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-2 bg-coffee-600 text-white rounded-full px-2 py-1">
                        <button onClick={() => useCartStore.getState().updateQuantity(p.id, inCart.quantity - 1)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Minus size={14} /></button>
                        <span className="text-sm font-bold w-6 text-center">{inCart.quantity}</span>
                        <button onClick={() => useCartStore.getState().updateQuantity(p.id, inCart.quantity + 1)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-coffee-600"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => addItem(p)} className="bg-coffee-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1"><Plus size={14} /> Agregar</button>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {!p.allow_takeaway && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">Solo local</span>}
                    {!p.allow_dine_in && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Solo llevar</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
