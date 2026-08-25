from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.models.order import Order
from app.models.cafe_table import CafeTable
from app.schemas.order import PaymentCreate
from app.services.order_service import list_orders, get_order_by_id, change_order_status, pay_order
from app.models.enums import OrderStatus
from typing import Optional

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])

@router.get("")
def list_all(status: Optional[str] = Query(None), table_id: Optional[str] = Query(None), db: Session = Depends(get_db), user=Depends(require_admin)):
    orders = list_orders(db, status_filter=status, table_id=table_id)
    result = []
    for o in orders:
        table = db.query(CafeTable).filter(CafeTable.id == o.table_id).first() if o.table_id else None
        result.append({
            "id": o.id,
            "public_code": o.public_code,
            "customer_name": o.customer_name,
            "table_id": o.table_id,
            "table_number": table.number if table else None,
            "table_name": table.name if table else None,
            "order_type": o.order_type,
            "status": o.status,
            "total_cop": o.total_cop,
            "subtotal_cop": o.subtotal_cop,
            "created_at": o.created_at,
            "paid_at": o.paid_at,
            "delivered_at": o.delivered_at,
            "items_count": len(o.items)
        })
    return result

@router.get("/{order_id}")
def get_one(order_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    o = get_order_by_id(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    table = db.query(CafeTable).filter(CafeTable.id == o.table_id).first() if o.table_id else None
    return {
        "id": o.id,
        "public_code": o.public_code,
        "customer_name": o.customer_name,
        "table_id": o.table_id,
        "table_number": table.number if table else None,
        "table_name": table.name if table else None,
        "order_type": o.order_type,
        "status": o.status,
        "subtotal_cop": o.subtotal_cop,
        "total_cop": o.total_cop,
        "created_at": o.created_at,
        "paid_at": o.paid_at,
        "delivered_at": o.delivered_at,
        "updated_at": o.updated_at,
        "items": [{"id": i.id, "product_id": i.product_id, "product_name": i.product_name, "unit_price_cop": i.unit_price_cop, "quantity": i.quantity, "subtotal_cop": i.subtotal_cop} for i in o.items],
        "payments": [{"id": p.id, "amount_cop": p.amount_cop, "payment_method": p.payment_method, "reference": p.reference, "created_at": p.created_at} for p in o.payments],
        "history": [{"id": h.id, "previous_status": h.previous_status, "new_status": h.new_status, "changed_by": h.changed_by, "created_at": h.created_at} for h in sorted(o.status_history, key=lambda x: x.created_at)]
    }

@router.post("/{order_id}/pay")
def pay(order_id: str, payload: PaymentCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    order, payment = pay_order(db, order_id, payload.payment_method, payload.reference, paid_by=user["id"])
    return {"order": {"id": order.id, "public_code": order.public_code, "status": order.status}, "payment": {"id": payment.id, "amount_cop": payment.amount_cop, "payment_method": payment.payment_method}}

@router.post("/{order_id}/start-preparation")
def start_preparation(order_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    return change_order_status(db, order_id, OrderStatus.PREPARING.value, changed_by=user["id"])

@router.post("/{order_id}/ready")
def ready(order_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    return change_order_status(db, order_id, OrderStatus.READY.value, changed_by=user["id"])

@router.post("/{order_id}/deliver")
def deliver(order_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    return change_order_status(db, order_id, OrderStatus.DELIVERED.value, changed_by=user["id"])

@router.post("/{order_id}/cancel")
def cancel(order_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    return change_order_status(db, order_id, OrderStatus.CANCELLED.value, changed_by=user["id"])
