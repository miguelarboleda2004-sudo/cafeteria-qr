import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { useState } from 'react'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<any>(null)

  const { data } = useQuery({ queryKey: ['admin-categories'], queryFn: async () => (await adminApi.listCategories()).data })

  const createMut = useMutation({
    mutationFn: async () => {
      if (editing) return (await adminApi.updateCategory(editing.id, { name, description })).data
      return (await adminApi.createCategory({ name, description, display_order: 0 })).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setName(''); setDescription(''); setEditing(null) }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await adminApi.deleteCategory(id)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] })
  })

  const startEdit = (c: any) => { setEditing(c); setName(c.name); setDescription(c.description || '') }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-semibold">{editing ? 'Editar' : 'Nueva'} categoría</h3>
        <div className="flex gap-3 mt-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre ej: Cafés" className="flex-1 px-3 py-2 border rounded-xl" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción opcional" className="flex-1 px-3 py-2 border rounded-xl" />
          <button onClick={() => createMut.mutate()} disabled={!name} className="bg-coffee-600 text-white px-5 py-2 rounded-xl font-medium disabled:opacity-50">{editing ? 'Actualizar' : 'Crear'}</button>
          {editing && <button onClick={() => { setEditing(null); setName(''); setDescription('') }} className="border px-4 py-2 rounded-xl">Cancelar</button>}
        </div>
        {createMut.isError && <div className="text-sm text-red-600 mt-2">{(createMut.error as any)?.response?.data?.detail}</div>}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Nombre</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Orden</th><th className="text-left p-3">Acciones</th></tr>
          </thead>
          <tbody>
            {data?.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.description || '-'}</td>
                <td className="p-3">{c.display_order}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(c)} className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs">Editar</button>
                  <button onClick={() => deleteMut.mutate(c.id)} className="px-3 py-1 border rounded-lg text-xs text-red-600">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
