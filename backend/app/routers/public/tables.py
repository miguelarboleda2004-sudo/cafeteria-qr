from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.table_service import get_table_by_code, mark_browsing, get_qr_url
from app.models.category import Category
from app.models.product import Product

router = APIRouter(prefix="/public/tables", tags=["public-tables"])

@router.get("/{public_code}")
def get_table(public_code: str, db: Session = Depends(get_db)):
    table = get_table_by_code(db, public_code)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada o QR inválido")
    # Marcar browsing si está disponible
    if table.status == "AVAILABLE":
        mark_browsing(db, public_code)
        table = get_table_by_code(db, public_code)
    return {
        "id": table.id,
        "name": table.name,
        "number": table.number,
        "public_code": table.public_code,
        "status": table.status,
        "is_active": table.is_active,
        "qr_url": get_qr_url(table.public_code)
    }

@router.get("/{public_code}/menu")
def get_menu(public_code: str, db: Session = Depends(get_db)):
    table = get_table_by_code(db, public_code)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa no encontrada o QR inválido")
    # Asegurar browsing
    if table.status == "AVAILABLE":
        mark_browsing(db, public_code)
        table = get_table_by_code(db, public_code)

    categories = db.query(Category).filter(Category.is_active == True).order_by(Category.display_order, Category.name).all()
    products = db.query(Product).filter(Product.is_active == True).all()
    # Enriquecer con categoría
    cat_map = {c.id: c.name for c in categories}

    return {
        "table": {
            "id": table.id,
            "name": table.name,
            "number": table.number,
            "public_code": table.public_code,
            "status": table.status,
        },
        "categories": [
            {"id": c.id, "name": c.name, "description": c.description, "display_order": c.display_order}
            for c in categories
        ],
        "products": [
            {
                "id": p.id,
                "category_id": p.category_id,
                "category_name": cat_map.get(p.category_id, ""),
                "name": p.name,
                "description": p.description,
                "price_cop": p.price_cop,
                "image_url": p.image_url,
                "is_available": p.is_available,
                "allow_dine_in": p.allow_dine_in,
                "allow_takeaway": p.allow_takeaway,
            }
            for p in products
        ]
    }
