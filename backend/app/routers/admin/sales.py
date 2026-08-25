from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.services.order_service import get_sales_summary
from app.models.order import Order
from app.models.enums import OrderStatus
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin/sales", tags=["admin-sales"])

@router.get("")
def list_sales(
    start: str = Query(None, description="ISO date"),
    end: str = Query(None, description="ISO date"),
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    start_dt = datetime.fromisoformat(start) if start else None
    end_dt = datetime.fromisoformat(end) if end else None
    summary = get_sales_summary(db, start_dt, end_dt)
    # Formatear órdenes
    orders = summary["orders"]
    return {
        "total_sales_cop": summary["total_sales_cop"],
        "total_orders": summary["total_orders"],
        "average_ticket_cop": summary["average_ticket_cop"],
        "orders": [
            {
                "id": o.id,
                "public_code": o.public_code,
                "customer_name": o.customer_name,
                "table_id": o.table_id,
                "order_type": o.order_type,
                "status": o.status,
                "total_cop": o.total_cop,
                "created_at": o.created_at,
                "paid_at": o.paid_at,
                "delivered_at": o.delivered_at,
                "payment_method": o.payments[0].payment_method if o.payments else None
            }
            for o in orders
        ]
    }

@router.get("/summary")
def summary(
    period: str = Query("today", description="today, yesterday, week, month"),
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    now = datetime.utcnow()
    if period == "today":
        start = datetime(now.year, now.month, now.day)
        end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        start = datetime(yesterday.year, yesterday.month, yesterday.day)
        end = datetime(now.year, now.month, now.day)
    elif period == "week":
        start = now - timedelta(days=7)
        end = now
    elif period == "month":
        start = datetime(now.year, now.month, 1)
        end = now
    else:
        start = None
        end = None

    summary_data = get_sales_summary(db, start, end)

    # Métricas adicionales dashboard
    from app.models.cafe_table import CafeTable
    from app.models.enums import TableStatus
    total_tables = db.query(CafeTable).filter(CafeTable.is_active==True).count()
    available = db.query(CafeTable).filter(CafeTable.status==TableStatus.AVAILABLE.value, CafeTable.is_active==True).count()
    occupied = total_tables - available

    pending_payment = db.query(Order).filter(Order.status==OrderStatus.PENDING_PAYMENT.value).count()
    preparing = db.query(Order).filter(Order.status==OrderStatus.PREPARING.value).count()
    ready = db.query(Order).filter(Order.status==OrderStatus.READY.value).count()
    delivered_today = db.query(Order).filter(Order.status==OrderStatus.DELIVERED.value, Order.delivered_at >= datetime(now.year, now.month, now.day)).count()

    return {
        "period": period,
        "sales": summary_data,
        "tables": {"total": total_tables, "available": available, "occupied": occupied},
        "orders": {"pending_payment": pending_payment, "preparing": preparing, "ready": ready, "delivered_today": delivered_today}
    }
