import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/api'
import { useState } from 'react'
import { formatDate } from '../../lib/utils'

export default function TablesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [qrData, setQrData] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => (await adminApi.listTables()).data,
    refetchInterval: 5000
  })

  const createMut = useMutation({
    mutationFn: async () => {
      return (await adminApi.createTable({ name, number: parseInt(number) })).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tables'] }); setName(''); setNumber('') }
  })

  const regenMut = useMutation({
    mutationFn: async (id: string) => (await adminApi.regenerateQR(id)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tables'] })
  })

  const viewTable = async (id: string) => {
    const res = await adminApi.getTable(id)
    setSelected(res.data)
    const qr = await adminApi.getQR(id)
    setQrData(qr.data)
  }

  const downloadQR = async (id: string, number: number) => {
    const res = await adminApi.getQR(id)
    const b64 = res.data.qr_base64
    const a = document.createElement('a')
    a.href = b64
    a.download = `QR-MESA-${String(number).padStart(2, '0')}.png`
    a.click()
  }

  if (isLoading) return <div>Cargando mesas...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mesas</h1>

      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h3 className="font-semibold">Crear mesa</h3>
        <div className="flex gap-3 mt-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre ej: Mesa 9" className="flex-1 px-3 py-2 border rounded-xl" />
          <input value={number} onChange={e => setNumber(e.target.value)} placeholder="Número ej: 9" type="number" className="w-32 px-3 py-2 border rounded-xl" />
          <button onClick={() => createMut.mutate()} disabled={!name || !number} className="bg-coffee-600 text-white px-5 py-2 rounded-xl font-medium disabled:opacity-50">Crear</button>
        </div>
        {createMut.isError && <div className="text-sm text-red-600 mt-2">{(createMut.error as any)?.response?.data?.detail || 'Error'}</div>}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((t: any) => (
          <div key={t.id} className="bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-bold">{t.name} <span className="text-gray-500 font-normal">#{t.number}</span></div>
                <div className="text-xs text-gray-500 font-mono">{t.public_code}</div>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${t.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>{t.status}</span>
              </div>
              <div className="text-xs text-gray-400">{t.is_active ? 'Activa' : 'Inactiva'}</div>
            </div>
            <div className="mt-3 text-xs text-gray-500">QR: {t.qr_url}</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => viewTable(t.id)} className="flex-1 bg-gray-900 text-white py-1.5 rounded-lg text-sm">Ver</button>
              <button onClick={() => downloadQR(t.id, t.number)} className="flex-1 border py-1.5 rounded-lg text-sm">Descargar QR</button>
              <button onClick={() => regenMut.mutate(t.id)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm">Regenerar</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{selected.name} - Estado {selected.status}</h3>
            <p className="text-sm text-gray-600">Código: {selected.public_code}</p>
            {qrData && (
              <div className="mt-4 text-center">
                <img src={qrData.qr_base64} alt="QR" className="w-64 h-64 mx-auto border rounded-xl" />
                <div className="text-xs font-mono mt-2">{qrData.qr_url}</div>
                <a href={qrData.qr_base64} download={qrData.download_filename} className="inline-block mt-3 bg-coffee-600 text-white px-4 py-2 rounded-full text-sm">Descargar PNG</a>
              </div>
            )}
            {selected.active_order ? (
              <div className="mt-4 bg-gray-50 p-3 rounded-xl">
                <div className="font-semibold">Pedido activo: {selected.active_order.public_code}</div>
                <div className="text-sm">Cliente: {selected.active_order.customer_name} • {selected.active_order.status}</div>
                <div className="text-sm font-bold">{selected.active_order.total_cop}</div>
                <ul className="text-xs mt-2 list-disc list-inside">
                  {selected.active_order.items.map((it: any, idx: number) => <li key={idx}>{it.product_name} x{it.quantity}</li>)}
                </ul>
              </div>
            ) : <div className="mt-4 text-sm text-gray-500">Sin pedido activo</div>}
            <button onClick={() => setSelected(null)} className="mt-4 w-full border py-2 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
