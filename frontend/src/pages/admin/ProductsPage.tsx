import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { formatCOP } from '../../lib/utils'
import { useState } from 'react'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ category_id: '', name: '', description: '', price_cop: '', image_url: '', is_available: true, allow_dine_in: true, allow_takeaway: true })

  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: async () => (await adminApi.listProducts({ include_inactive: true })).data })
  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: async () => (await adminApi.listCategories()).data })

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price_cop: parseInt(form.price_cop) }
      if (editing) return (await adminApi.updateProduct(editing.id, payload)).data
      return (await adminApi.createProduct(payload)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setShowForm(false); setEditing(null); setForm({ category_id: '', name: '', description: '', price_cop: '', image_url: '', is_available: true, allow_dine_in: true, allow_takeaway: true }) }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await adminApi.deleteProduct(id)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] })
  })

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ category_id: p.category_id, name: p.name, description: p.description || '', price_cop: String(p.price_cop), image_url: p.image_url || '', is_available: p.is_available, allow_dine_in: p.allow_dine_in, allow_takeaway: p.allow_takeaway })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={() => setShowForm(true)} className="bg-coffee-600 text-white px-5 py-2 rounded-xl font-medium">Nuevo producto</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((p: any) => (
          <div key={p.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <img src={p.image_url || `https://picsum.photos/seed/${p.id}/400/300`} className="h-40 w-full object-cover" alt={p.name} />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold">{p.name}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{p.category_name}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>
              <div className="font-bold text-coffee-700 mt-2">{formatCOP(p.price_cop)}</div>
              <div className="flex gap-1 mt-2">
                <span className={`text-[10px] px-2 py-1 rounded-full ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.is_available ? 'Disponible' : 'Agotado'}</span>
                {!p.allow_takeaway && <span className="text-[10px] px-2 py-1 bg-amber-100 rounded-full">Solo local</span>}
                {!p.is_active && <span className="text-[10px] px-2 py-1 bg-gray-200 rounded-full">Inactivo</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(p)} className="flex-1 bg-gray-900 text-white py-1.5 rounded-lg text-sm">Editar</button>
                <button onClick={() => deleteMut.mutate(p.id)} className="px-3 py-1.5 border rounded-lg text-sm text-red-600">Desactivar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="font-bold text-lg">{editing ? 'Editar' : 'Nuevo'} producto</h3>
            <div className="space-y-3 mt-4">
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                <option value="">Selecciona categoría</option>
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre" className="w-full px-3 py-2 border rounded-xl" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción" className="w-full px-3 py-2 border rounded-xl" />
              <input value={form.price_cop} onChange={e => setForm({ ...form, price_cop: e.target.value })} placeholder="Precio COP ej: 8500" type="number" className="w-full px-3 py-2 border rounded-xl" />
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL imagen (opcional, usa Supabase Storage en prod)" className="w-full px-3 py-2 border rounded-xl" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} /> Disponible</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allow_dine_in} onChange={e => setForm({ ...form, allow_dine_in: e.target.checked })} /> Permite consumo en local</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allow_takeaway} onChange={e => setForm({ ...form, allow_takeaway: e.target.checked })} /> Permite para llevar</label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="flex-1 border py-2 rounded-xl">Cancelar</button>
              <button onClick={() => createMut.mutate()} disabled={!form.name || !form.category_id || !form.price_cop} className="flex-1 bg-coffee-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50">Guardar</button>
            </div>
            {createMut.isError && <div className="text-sm text-red-600 mt-2">{(createMut.error as any)?.response?.data?.detail}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
