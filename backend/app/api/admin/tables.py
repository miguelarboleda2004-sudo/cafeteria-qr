from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.schemas.cafe_table import CafeTableCreate, CafeTableUpdate, CafeTableResponse
from app.services.table_service import list_tables, create_table, update_table, delete_table, regenerate_qr, get_table_by_id, get_qr_url
from app.models.order import Order
from app.models.enums import OrderStatus
import qrcode
import io
import base64

router = APIRouter(prefix="/admin/tables", tags=["admin-tables"])

@router.get("", response_model=list[CafeTableResponse])
def list_all(db: Session = Depends(get_db), user=Depends(require_admin)):
    tables = list_tables(db)
    result = []
    for t in tables:
        result.append(CafeTableResponse(
            id=t.id, name=t.name, number=t.number, public_code=t.public_code,
            status=t.status, is_active=t.is_active, created_at=t.created_at, updated_at=t.updated_at,
            qr_url=get_qr_url(t.public_code)
        ))
    return result

@router.post("", response_model=CafeTableResponse)
def create(payload: CafeTableCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    table = create_table(db, payload.name, payload.number, payload.is_active)
    return CafeTableResponse(
        id=table.id, name=table.name, number=table.number, public_code=table.public_code,
        status=table.status, is_active=table.is_active, created_at=table.created_at, updated_at=table.updated_at,
        qr_url=get_qr_url(table.public_code)
    )

@router.get("/{table_id}")
def get_one(table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    active_order = db.query(Order).filter(
        Order.table_id == table_id,
        Order.status.in_([OrderStatus.PENDING_PAYMENT.value, OrderStatus.PAID.value, OrderStatus.PREPARING.value, OrderStatus.READY.value])
    ).order_by(Order.created_at.desc()).first()
    order_data = None
    if active_order:
        order_data = {
            "id": active_order.id,
            "public_code": active_order.public_code,
            "customer_name": active_order.customer_name,
            "order_type": active_order.order_type,
            "status": active_order.status,
            "total_cop": active_order.total_cop,
            "created_at": active_order.created_at,
            "items": [{"product_name": i.product_name, "quantity": i.quantity, "unit_price_cop": i.unit_price_cop, "subtotal_cop": i.subtotal_cop} for i in active_order.items]
        }
    return {
        "id": table.id, "name": table.name, "number": table.number, "public_code": table.public_code,
        "status": table.status, "is_active": table.is_active, "created_at": table.created_at, "updated_at": table.updated_at,
        "qr_url": get_qr_url(table.public_code),
        "active_order": order_data,
        "history": db.query(Order).filter(Order.table_id==table_id).order_by(Order.created_at.desc()).limit(10).all()
    }

@router.put("/{table_id}", response_model=CafeTableResponse)
def update(payload: CafeTableUpdate, table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    table = update_table(db, table_id, data)
    return CafeTableResponse(
        id=table.id, name=table.name, number=table.number, public_code=table.public_code,
        status=table.status, is_active=table.is_active, created_at=table.created_at, updated_at=table.updated_at,
        qr_url=get_qr_url(table.public_code)
    )

@router.delete("/{table_id}")
def delete(table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    return delete_table(db, table_id)

@router.post("/{table_id}/regenerate-qr", response_model=CafeTableResponse)
def regen(table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    table = regenerate_qr(db, table_id)
    return CafeTableResponse(
        id=table.id, name=table.name, number=table.number, public_code=table.public_code,
        status=table.status, is_active=table.is_active, created_at=table.created_at, updated_at=table.updated_at,
        qr_url=get_qr_url(table.public_code)
    )

@router.get("/{table_id}/qr")
def get_qr(table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    url = get_qr_url(table.public_code)
    # Generar QR como PNG base64 y binario
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return {
        "qr_url": url,
        "public_code": table.public_code,
        "table_number": table.number,
        "table_name": table.name,
        "qr_base64": f"data:image/png;base64,{b64}",
        "download_filename": f"QR-MESA-{str(table.number).zfill(2)}.png"
    }

@router.get("/{table_id}/qr.png")
def get_qr_png(table_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    table = get_table_by_id(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    url = get_qr_url(table.public_code)
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png", headers={"Content-Disposition": f'attachment; filename="QR-MESA-{str(table.number).zfill(2)}.png"'})
