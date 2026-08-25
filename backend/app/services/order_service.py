from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.order import Order, generate_order_code
from app.models.order_item import OrderItem
from app.models.order_status_history import OrderStatusHistory
from app.models.payment import Payment
from app.models.product import Product
from app.models.cafe_table import CafeTable
from app.models.enums import OrderStatus, OrderType, VALID_ORDER_TRANSITIONS, TableStatus
from app.services.table_service import get_table_by_code, update_table_status_from_order
from datetime import datetime
import uuid

def validate_and_calculate_items(db: Session, items_data, order_type: str):
    """
    Valida productos y calcula totales en backend. No confía en frontend.
    """
    if not items_data:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")
    
    total = 0
    validated = []
    for item in items_data:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item.product_id} no existe o está inactivo")
        if not product.is_available:
            raise HTTPException(status_code=400, detail=f"Producto '{product.name}' no está disponible (agotado)")
        if order_type == OrderType.TAKEAWAY.value and not product.allow_takeaway:
            raise HTTPException(status_code=400, detail=f"Producto '{product.name}' no permite pedidos para llevar")
        if order_type == OrderType.DINE_IN.value and not product.allow_dine_in:
            raise HTTPException(status_code=400, detail=f"Producto '{product.name}' no permite consumo en el local")
        if item.quantity < 1 or item.quantity > 20:
            raise HTTPException(status_code=400, detail=f"Cantidad inválida para '{product.name}': debe ser entre 1 y 20")
        
        unit_price = product.price_cop
        subtotal = unit_price * item.quantity
        total += subtotal
        validated.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "subtotal": subtotal
        })
    return validated, total

def create_order(db: Session, table_code: str, customer_name: str, order_type: str, items_data):
    # Validar mesa
    table = get_table_by_code(db, table_code)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada o código QR inválido")
    if not table.is_active:
        raise HTTPException(status_code=400, detail="Mesa inactiva")
    
    # Validar order_type
    if order_type not in [OrderType.DINE_IN.value, OrderType.TAKEAWAY.value]:
        raise HTTPException(status_code=400, detail="Tipo de consumo inválido")
    
    validated_items, total = validate_and_calculate_items(db, items_data, order_type)

    # Crear orden transaccionalmente
    order = Order(
        public_code=generate_order_code(),
        table_id=table.id,
        customer_name=customer_name.strip(),
        order_type=order_type,
        status=OrderStatus.PENDING_PAYMENT.value,
        subtotal_cop=total,
        total_cop=total
    )
    db.add(order)
    db.flush()  # obtener order.id

    for v in validated_items:
        product = v["product"]
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price_cop=v["unit_price"],
            quantity=v["quantity"],
            subtotal_cop=v["subtotal"]
        )
        db.add(order_item)

    # Historial
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=None,
        new_status=OrderStatus.PENDING_PAYMENT.value,
        changed_by=None
    )
    db.add(history)

    # Actualizar estado mesa
    table.status = TableStatus.ORDER_PENDING_PAYMENT.value
    table.last_browsing_at = None

    db.commit()
    db.refresh(order)
    return order

def get_order_by_public_code(db: Session, public_code: str):
    return db.query(Order).filter(Order.public_code == public_code).first()

def get_order_by_id(db: Session, order_id: str):
    return db.query(Order).filter(Order.id == order_id).first()

def list_orders(db: Session, status_filter: str = None, table_id: str = None):
    q = db.query(Order).order_by(Order.created_at.desc())
    if status_filter:
        q = q.filter(Order.status == status_filter)
    if table_id:
        q = q.filter(Order.table_id == table_id)
    return q.all()

def change_order_status(db: Session, order_id: str, new_status: str, changed_by: str = None):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    current = order.status
    allowed = VALID_ORDER_TRANSITIONS.get(current, [])
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Transición no permitida: {current} -> {new_status}. Permitidas: {allowed}")

    previous = order.status
    order.status = new_status
    now = datetime.utcnow()
    if new_status == OrderStatus.PAID.value:
        order.paid_at = now
    elif new_status == OrderStatus.DELIVERED.value:
        order.delivered_at = now

    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=previous,
        new_status=new_status,
        changed_by=changed_by
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    # Actualizar mesa
    if order.table_id:
        update_table_status_from_order(db, order.table_id, new_status)

    return order

def pay_order(db: Session, order_id: str, payment_method: str, reference: str = None, paid_by: str = None):
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.status != OrderStatus.PENDING_PAYMENT.value:
        raise HTTPException(status_code=400, detail=f"El pedido no está pendiente de pago (estado actual: {order.status})")
    
    # Validar método
    from app.models.enums import PaymentMethod
    if payment_method not in [e.value for e in PaymentMethod]:
        raise HTTPException(status_code=400, detail="Método de pago inválido")

    # Crear pago
    payment = Payment(
        order_id=order.id,
        amount_cop=order.total_cop,
        payment_method=payment_method,
        reference=reference,
        paid_by=paid_by
    )
    db.add(payment)

    # Cambiar estado a PAID
    previous = order.status
    order.status = OrderStatus.PAID.value
    order.paid_at = datetime.utcnow()
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=previous,
        new_status=OrderStatus.PAID.value,
        changed_by=paid_by
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    if order.table_id:
        update_table_status_from_order(db, order.table_id, OrderStatus.PAID.value)

    return order, payment

def get_sales_summary(db: Session, start_date=None, end_date=None):
    from sqlalchemy import func
    # Ventas = pedidos DELIVERED (o PAID en adelante) con pago
    q = db.query(Order).filter(Order.status == OrderStatus.DELIVERED.value)
    if start_date:
        q = q.filter(Order.created_at >= start_date)
    if end_date:
        q = q.filter(Order.created_at <= end_date)
    orders = q.all()
    total_sales = sum(o.total_cop for o in orders)
    count = len(orders)
    avg = total_sales // count if count > 0 else 0
    return {
        "total_sales_cop": total_sales,
        "total_orders": count,
        "average_ticket_cop": avg,
        "orders": orders
    }
