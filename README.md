# Café Aroma — Sistema QR para Cafetería

Sistema web profesional para cafetería con pedidos mediante códigos QR. **Mobile-first** para clientes y **panel administrativo** para gestión completa.

Stack: **FastAPI + PostgreSQL (Supabase) + React + Vite + Tailwind + Supabase Auth + Supabase Storage**. Preparado para **Vercel (frontend) + Render (backend) + Supabase (DB/Auth/Storage)**.

---

## Flujo completo

```
Cliente se sienta → Escanea QR (https://frontend/menu/{public_code}) → Sistema identifica mesa → Ve menú → Agrega al carrito → Elige consumo (Local / Para llevar) → Ingresa nombre → Confirma pedido → Recibe recibo digital (PENDING_PAYMENT) → Va a caja → Cajero registra pago (PAID) → Cocina prepara (PREPARING → READY) → Entrega (DELIVERED) → Mesa vuelve a AVAILABLE → Venta en historial
```

---

## Estructura del proyecto

```
cafeteria-system/
├── backend/               # FastAPI + SQLAlchemy + Alembic + Pytest
│   ├── app/
│   │   ├── api/public/    # /public/tables/{code}, /public/orders
│   │   ├── api/admin/     # mesas, productos, categorías, pedidos, ventas, dashboard
│   │   ├── core/          # config, security (Supabase JWT)
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # lógica negocio (cálculo precios, transiciones)
│   │   ├── dependencies/  # auth Supabase
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/              # React + TypeScript + Vite + Tailwind + React Query + Zustand
│   └── src/
│       ├── pages/         # Menu, Cart, Checkout, Receipt, Admin/*
│       ├── layouts/       # AdminLayout
│       ├── store/         # cartStore (zustand + persist)
│       ├── services/      # api.ts (axios)
│       └── lib/           # supabase, utils
├── docs/
├── docker-compose.yml
└── README.md
```

---

## Requisitos

- Python 3.12+ (probado en 3.13)
- Node 18+
- PostgreSQL (Supabase) o SQLite para dev
- Supabase proyecto (opcional para dev — modo DEV disponible)

---

## 1. Configuración Supabase

1. Crea proyecto en https://supabase.com
2. **Database**: usa `DATABASE_URL` (Connection string → `postgresql://...` desde Settings → Database). Para backend usa `postgresql+psycopg2://` o `postgresql://` con driver `psycopg`.
3. **Auth**: crea usuario admin en Authentication → Users. Opcional: asigna `role` en `app_metadata` = `ADMIN`.
4. **Storage**: crea bucket `product-images` (public). Políticas:
   ```sql
   -- Permitir lectura pública
   CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
   -- Permitir escritura a autenticados
   CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
   ```
5. Copia `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (Settings → API → JWT Secret).

---

## 2. Variables de entorno

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql+psycopg2://postgres:password@db.supabase.co:5432/postgres
# Dev sin Postgres:
# DATABASE_URL=sqlite:///./cafeteria.db

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:5173,https://tu-front.vercel.app
FRONTEND_PUBLIC_URL=http://localhost:5173
SECRET_KEY=change-me
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CAFE_NAME=Café Aroma
```

Hay `.env.example` en ambos directorios.

---

## 3. Ejecución local (sin Docker)

### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
# Alembic (opcional, alternativo a create_all):
# alembic upgrade head
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs
# Seed: POST http://localhost:8000/api/seed
curl -X POST http://localhost:8000/api/seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Flujo local demo (sin Supabase):
1. Backend en `sqlite` + `SUPABASE_JWT_SECRET` vacío → acepta `X-Dev-Role: ADMIN`
2. Frontend → `/admin/login` → botón **"Entrar en modo DEV"**
3. Crear mesas, categorías, productos en admin
4. Copiar `public_code` de mesa → abrir `http://localhost:5173/menu/{code}`
5. Hacer pedido → recibo → en `/admin/cashier` registrar pago → `/admin/kitchen` gestionar

---

## 4. Docker (opcional)

```bash
docker-compose up --build
# backend http://localhost:8000
# frontend http://localhost:5173
# db localhost:5432 (postgres:postgres/cafeteria)
```

---

## 5. Migraciones Alembic

```bash
cd backend
alembic revision --autogenerate -m "initial"
alembic upgrade head
alembic downgrade -1
```

En SQLite `Base.metadata.create_all` ya crea tablas automáticamente.

---

## 6. API Overview

### Público (sin auth)
```
GET  /api/public/tables/{public_code}          # valida QR, marca BROWSING
GET  /api/public/tables/{public_code}/menu     # categorías + productos
POST /api/public/orders                         # crea pedido (recalcula precios)
GET  /api/public/orders/{public_code}           # recibo / seguimiento
```

### Admin (Bearer Supabase JWT o X-Dev-Role)
```
GET  /api/admin/dashboard
GET  /api/admin/tables
POST /api/admin/tables
GET  /api/admin/tables/{id}
PUT  /api/admin/tables/{id}
DELETE /api/admin/tables/{id}
POST /api/admin/tables/{id}/regenerate-qr
GET  /api/admin/tables/{id}/qr                 # JSON base64
GET  /api/admin/tables/{id}/qr.png             # PNG descarga

GET  /api/admin/categories
POST /api/admin/categories
PUT  /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

GET  /api/admin/products
POST /api/admin/products
GET  /api/admin/products/{id}
PUT  /api/admin/products/{id}
DELETE /api/admin/products/{id}
POST /api/admin/products/{id}/upload-image

GET  /api/admin/orders
GET  /api/admin/orders/{id}
POST /api/admin/orders/{id}/pay
POST /api/admin/orders/{id}/start-preparation
POST /api/admin/orders/{id}/ready
POST /api/admin/orders/{id}/deliver
POST /api/admin/orders/{id}/cancel

GET  /api/admin/sales
GET  /api/admin/sales/summary?period=today|yesterday|week|month
```

---

## 7. Reglas de negocio implementadas

- **Precios**: backend recalcula `subtotal`/`total` consultando `products` — nunca confía en frontend.
- **Disponibilidad**: bloquea productos `!is_available` o `!is_active`.
- **Para llevar**: si `order_type=TAKEAWAY`, todos los productos deben `allow_takeaway=true`.
- **Mesa**: valida `is_active` y `public_code` único (secrets.token_hex). Regenerar QR invalida anterior.
- **Transiciones**: `VALID_ORDER_TRANSITIONS` estricto; `PAY` crea `payments`, mueve mesa a `PREPARING`; `DELIVERED` libera mesa si no hay otros activos.
- **BROWSING timeout**: 15 min (configurable) → vuelve a `AVAILABLE`.
- **Dinero**: `BigInteger` COP, sin floats, formato `Intl.NumberFormat es-CO`.
- **Soft delete**: mesas/productos → `is_active=false`.

---

## 8. Autenticación

- Frontend usa `supabase.auth.signInWithPassword` → guarda `access_token` en localStorage → envía `Authorization: Bearer <token>`.
- Backend `verify_supabase_token`: si `SUPABASE_JWT_SECRET` configurado, verifica HS256; si no, decodifica sin verificar (dev).
- Alternativa dev: `X-Dev-Role: ADMIN` header.
- Todos los `/api/admin/*` requieren `require_admin`.

---

## 9. Despliegue

### Render (Backend)
- **Root**: `backend`
- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env**: copiar `backend/.env` variables, con `DATABASE_URL` Supabase + `CORS_ORIGINS` + `FRONTEND_PUBLIC_URL` (tu Vercel URL)
- Health check: `/health`

### Vercel (Frontend)
- **Root**: `frontend`
- **Framework**: Vite
- **Build**: `npm run build` → `dist`
- **Env**: `VITE_API_URL` = URL Render, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Rewrites: SPA fallback a `index.html` (vercel.json automático)

### Supabase
- PostgreSQL ya hosteado, Auth y Storage configurados. Migrar con Alembic o `create_all` + `seed`.

---

## 10. Tests

```bash
cd backend
pytest -v
# 6 tests: creación, cálculo, bloqueos, transiciones, QR inválido

cd frontend
npm run build   # typecheck + build
npm run test    # vitest (si configuras)
```

E2E flujo Playwright sugerido en `docs/`.

---

## 11. Diseño

- **Cliente**: mobile-first, bottom bar, categorías scroll horizontal, cards con imagen, botones +/-, contador flotante, checkout en 2 pasos.
- **Admin**: sidebar + topbar, dashboard métricas, mapa mesas con colores + texto, tablas con filtros, modales de detalle, acciones rápidas (pagar, preparar, listo, entregar).

---

## 12. Seguridad

- Validación Pydantic + Zod
- CORS configurable
- JWT verificado en backend, roles desde Supabase
- FK, unique, checks, índices
- No secretos en repo (`.env.example`)
- Validación MIME/tamaño imágenes, límite 5MB, bucket `product-images`

---

## 13. Roadmap

- Stock por ingredientes, descuento automático
- Supabase Realtime para mesas/pedidos (actualmente polling 4-5s + React Query)
- Roles `CASHIER`, `KITCHEN`, `STAFF` granulares
- Reportes avanzados + export CSV
- Pagos online (MercadoPago)

---

**Licencia**: MIT — listo para fork a GitHub.
