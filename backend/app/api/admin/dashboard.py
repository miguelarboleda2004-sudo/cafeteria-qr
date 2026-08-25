from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.models.cafe_table import CafeTable
from app.models.order import Order
from app.models.enums import TableStatus, OrderStatus
from datetime import datetime

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])

@router.get("")
def get_dashboard(db: Session = Depends(get_db), user=Depends(require_admin)):
    total_tables = db.query(CafeTable).filter(CafeTable.is_active==True).count()
    available = db.query(CafeTable).filter(CafeTable.status==TableStatus.AVAILABLE.value, CafeTable.is_active==True).count()
    browsing = db.query(CafeTable).filter(CafeTable.status==TableStatus.BROWSING.value).count()
    pending = db.query(CafeTable).filter(CafeTable.status==TableStatus.ORDER_PENDING_PAYMENT.value).count()
    preparing = db.query(CafeTable).filter(CafeTable.status==TableStatus.PREPARING.value).count()
    ready = db.query(CafeTable).filter(CafeTable.status==TableStatus.READY.value).count()

    pending_payment_orders = db.query(Order).filter(Order.status==OrderStatus.PENDING_PAYMENT.value).count()
    paid_orders = db.query(Order).filter(Order.status==OrderStatus.PAID.value).count()
    preparing_orders = db.query(Order).filter(Order.status==OrderStatus.PREPARING.value).count()
    ready_orders = db.query(Order).filter(Order.status==OrderStatus.READY.value).count()
    today_start = datetime(datetime.utcnow().year, datetime.utcnow().month, datetime.utcnow().day)
    delivered_today = db.query(Order).filter(Order.status==OrderStatus.DELIVERED.value, Order.created_at >= today_start).count()
    sales_today = db.query(Order).filter(Order.status==OrderStatus.DELIVERED.value, Order.created_at >= today_start).all()
    total_sales_today = sum(o.total_cop for o in sales_today)

    tables = db.query(CafeTable).filter(CafeTable.is_active==True).order_by(CafeTable.number).all()
    tables_data = []
    for t in tables:
        active_order = db.query(Order).filter(
            Order.table_id==t.id,
            Order.status.in_([OrderStatus.PENDING_PAYMENT.value, OrderStatus.PAID.value, OrderStatus.PREPARING.value, OrderStatus.READY.value])
        ).order_by(Order.created_at.desc()).first()
        tables_data.append({
            "id": t.id, "name": t.name, "number": t.number, "public_code": t.public_code,
            "status": t.status, "active_order": {
                "public_code": active_order.public_code,
                "customer_name": active_order.customer_name,
                "status": active_order.status,
                "total_cop": active_order.total_cop
            } if active_order else None
        })

    return {
        "tables_summary": {
            "total": total_tables,
            "available": available,
            "browsing": browsing,
            "pending_payment": pending,
            "preparing": preparing,
            "ready": ready
        },
        "orders_summary": {
            "pending_payment": pending_payment_orders,
            "paid": paid_orders,
            "preparing": preparing_orders,
            "ready": ready_orders,
            "delivered_today": delivered_today,
            "sales_today_cop": total_sales_today
        },
        "tables": tables_data
    }
