from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from app.services.order_service import create_order, get_order_by_public_code
from app.models.cafe_table import CafeTable

router = APIRouter(prefix="/public/orders", tags=["public-orders"])

@router.post("", response_model=OrderResponse)
def create_public_order(payload: OrderCreate, db: Session = Depends(get_db)):
    order = create_order(db, payload.table_code, payload.customer_name, payload.order_type, payload.items)
    # Cargar relaciones
    db.refresh(order)
    # Construir respuesta
    table = db.query(CafeTable).filter(CafeTable.id == order.table_id).first() if order.table_id else None
    items = [
        OrderItemResponse.model_validate(i) for i in order.items
    ]
    return OrderResponse(
        id=order.id,
        public_code=order.public_code,
        table_id=order.table_id,
        table_number=table.number if table else None,
        table_name=table.name if table else None,
        customer_name=order.customer_name,
        order_type=order.order_type,
        status=order.status,
        subtotal_cop=order.subtotal_cop,
        total_cop=order.total_cop,
        created_at=order.created_at,
        paid_at=order.paid_at,
        delivered_at=order.delivered_at,
        updated_at=order.updated_at,
        items=items,
        payments=[]
    )

@router.get("/{public_code}", response_model=OrderResponse)
def get_public_order(public_code: str, db: Session = Depends(get_db)):
    order = get_order_by_public_code(db, public_code)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    table = db.query(CafeTable).filter(CafeTable.id == order.table_id).first() if order.table_id else None
    items = [OrderItemResponse.model_validate(i) for i in order.items]
    payments = [{"id": p.id, "amount_cop": p.amount_cop, "payment_method": p.payment_method, "reference": p.reference, "created_at": p.created_at.isoformat() if p.created_at else None} for p in order.payments]
    return OrderResponse(
        id=order.id,
        public_code=order.public_code,
        table_id=order.table_id,
        table_number=table.number if table else None,
        table_name=table.name if table else None,
        customer_name=order.customer_name,
        order_type=order.order_type,
        status=order.status,
        subtotal_cop=order.subtotal_cop,
        total_cop=order.total_cop,
        created_at=order.created_at,
        paid_at=order.paid_at,
        delivered_at=order.delivered_at,
        updated_at=order.updated_at,
        items=items,
        payments=payments
    )
