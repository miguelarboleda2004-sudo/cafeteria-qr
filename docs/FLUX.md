# Flujo detallado

```
CLIENTE SE SIENTA
        ↓
ESCANEA QR (https://frontend/menu/{public_code})
        ↓
SISTEMA IDENTIFICA MESA (GET /public/tables/{code} → valida is_active)
        ↓
MARCA BROWSING (si AVAILABLE)
        ↓
ABRE MENÚ (GET /public/tables/{code}/menu → categorías + productos)
        ↓
SELECCIONA PRODUCTOS (add to cart, validación allow_takeaway/dine_in en UI)
        ↓
CARRITO (persistido en localStorage Zustand)
        ↓
ELIGE: LOCAL / PARA LLEVAR + NOMBRE
        ↓
CONFIRMA PEDIDO (POST /public/orders → backend recalcula, crea order + items + history, mesa → ORDER_PENDING_PAYMENT)
        ↓
RECIBE CÓDIGO (ORD-XXXX + public_code)
        ↓
VA A CAJA (GET /order/{public_code} → estado PENDING_PAYMENT + polling 5s)
        ↓
ADMINISTRADOR REGISTRA PAGO (POST /admin/orders/{id}/pay → crea payments, estado PAID, mesa PREPARING)
        ↓
PEDIDO EN PREPARACIÓN (POST /start-preparation → PREPARING)
        ↓
PEDIDO LISTO (POST /ready → READY, mesa READY)
        ↓
PEDIDO ENTREGADO (POST /deliver → DELIVERED, mesa → AVAILABLE si no hay otros activos)
        ↓
VENTA GUARDADA (historial, no se borra)
        ↓
MESA DISPONIBLE
```
