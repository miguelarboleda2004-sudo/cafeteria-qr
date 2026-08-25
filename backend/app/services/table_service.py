from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.cafe_table import CafeTable, generate_public_code
from app.models.enums import TableStatus
from app.core.config import settings
from datetime import datetime, timedelta
import secrets

def get_qr_url(public_code: str) -> str:
    base = settings.FRONTEND_PUBLIC_URL.rstrip("/")
    return f"{base}/menu/{public_code}"

def get_table_by_code(db: Session, public_code: str):
    table = db.query(CafeTable).filter(CafeTable.public_code == public_code, CafeTable.is_active == True).first()
    return table

def get_table_by_id(db: Session, table_id: str):
    return db.query(CafeTable).filter(CafeTable.id == table_id).first()

def list_tables(db: Session):
    # Auto-expirar BROWSING
    timeout = settings.BROWSING_TIMEOUT_MINUTES
    cutoff = datetime.utcnow() - timedelta(minutes=timeout)
    browsing_tables = db.query(CafeTable).filter(CafeTable.status == TableStatus.BROWSING.value).all()
    for t in browsing_tables:
        if t.last_browsing_at and t.last_browsing_at < cutoff:
            t.status = TableStatus.AVAILABLE.value
    if browsing_tables:
        db.commit()
    return db.query(CafeTable).order_by(CafeTable.number).all()

def create_table(db: Session, name: str, number: int, is_active: bool = True):
    # Verificar número único
    exists = db.query(CafeTable).filter(CafeTable.number == number).first()
    if exists:
        raise HTTPException(status_code=400, detail=f"Ya existe la mesa número {number}")
    table = CafeTable(name=name, number=number, is_active=is_active, public_code=secrets.token_hex(4), status=TableStatus.AVAILABLE.value)
    db.add(table)
    try:
        db.commit()
        db.refresh(table)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear mesa, número o código duplicado")
    return table

def update_table(db: Session, table_id: str, data: dict):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    if "number" in data and data["number"] != table.number:
        exists = db.query(CafeTable).filter(CafeTable.number == data["number"], CafeTable.id != table_id).first()
        if exists:
            raise HTTPException(status_code=400, detail=f"Ya existe la mesa número {data['number']}")
    for k, v in data.items():
        if v is not None and hasattr(table, k):
            setattr(table, k, v)
    db.commit()
    db.refresh(table)
    return table

def delete_table(db: Session, table_id: str):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    # Soft delete
    table.is_active = False
    db.commit()
    return {"detail": "Mesa desactivada"}

def regenerate_qr(db: Session, table_id: str):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    table.public_code = secrets.token_hex(4)
    table.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(table)
    return table

def mark_browsing(db: Session, public_code: str):
    table = get_table_by_code(db, public_code)
    if not table:
        return None
    if table.status == TableStatus.AVAILABLE.value:
        table.status = TableStatus.BROWSING.value
        table.last_browsing_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
    elif table.status == TableStatus.BROWSING.value:
        table.last_browsing_at = datetime.utcnow()
        db.commit()
    return table

def update_table_status_from_order(db: Session, table_id: str, order_status: str, has_active_orders: bool = None):
    from app.models.enums import TABLE_STATUS_FROM_ORDER, TableStatus, OrderStatus
    table = get_table_by_id(db, table_id)
    if not table:
        return
    if order_status == OrderStatus.DELIVERED.value or order_status == OrderStatus.CANCELLED.value:
        # Verificar si hay otros pedidos activos
        from app.models.order import Order
        active = db.query(Order).filter(
            Order.table_id == table_id,
            Order.status.in_([OrderStatus.PENDING_PAYMENT.value, OrderStatus.PAID.value, OrderStatus.PREPARING.value, OrderStatus.READY.value])
        ).first()
        if not active:
            table.status = TableStatus.AVAILABLE.value
        # else mantener estado del pedido activo más reciente
    else:
        mapped = TABLE_STATUS_FROM_ORDER.get(order_status)
        if mapped:
            table.status = mapped.value
        else:
            # fallback
            table.status = TableStatus.PREPARING.value
    db.commit()
