import { Coffee, QrCode, Smartphone, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-coffee-600 rounded-lg flex items-center justify-center text-white"><Coffee size={18} /></div>
            <span className="font-display font-bold text-xl text-coffee-900">Café Aroma</span>
          </div>
          <Link to="/admin/login" className="text-sm bg-coffee-600 text-white px-4 py-2 rounded-full font-medium">Admin</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-coffee-900 leading-tight">Tu café favorito,<br />a un QR de distancia</h1>
            <p className="mt-4 text-gray-600 text-lg">Escanea el QR de tu mesa, pide desde tu celular y disfruta. Sin apps, sin esperas innecesarias.</p>
            <div className="mt-8 p-6 bg-white rounded-2xl border shadow-sm">
              <h3 className="font-semibold flex items-center gap-2"><QrCode size={18} /> ¿Cómo funciona?</h3>
              <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li>Siéntate en tu mesa</li>
                <li>Escanea el QR</li>
                <li>Elige tus productos</li>
                <li>Confirma y paga en caja</li>
                <li>¡Disfruta!</li>
              </ol>
              <p className="mt-4 text-xs text-gray-500">Demo: usa el código de una mesa creada en el panel admin. Ej: /menu/XXXX</p>
              <Link to="/admin/login" className="inline-block mt-4 bg-coffee-600 text-white px-6 py-2.5 rounded-full font-medium">Ir al panel admin</Link>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-xl border">
              <div className="aspect-square bg-gradient-to-br from-coffee-50 to-orange-50 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                <Smartphone size={48} className="text-coffee-600" />
                <h4 className="font-display font-bold text-xl mt-4">Menú Digital</h4>
                <p className="text-sm text-gray-600 mt-2">Fotos, precios, categorías y disponibilidad en tiempo real</p>
                <div className="mt-6 grid grid-cols-3 gap-3 w-full">
                  {['Cafés','Postres','Snacks'].map(c => (
                    <div key={c} className="bg-white rounded-xl p-3 border text-center">
                      <Utensils size={16} className="mx-auto text-coffee-600" />
                      <div className="text-xs font-medium mt-1">{c}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <QrCode size={16} /> Cada mesa tiene su QR único
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        Café Aroma • Sistema QR • Hecho con FastAPI + React + Supabase
      </footer>
    </div>
  )
}
