from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
# Import models to register
from app.models import *  # noqa
from app.api.public.tables import router as public_tables_router
from app.api.public.orders import router as public_orders_router
from app.api.admin.tables import router as admin_tables_router
from app.api.admin.categories import router as admin_categories_router
from app.api.admin.products import router as admin_products_router
from app.api.admin.orders import router as admin_orders_router
from app.api.admin.sales import router as admin_sales_router
from app.api.admin.dashboard import router as admin_dashboard_router
import os

# Crear tablas si no existen (para sqlite dev). En prod usar alembic.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cafetería QR API",
    description="Sistema de pedidos por QR para cafetería",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.cors_origins_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static for uploads
upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(upload_dir, exist_ok=True)
if os.path.exists(upload_dir):
    app.mount("/static", StaticFiles(directory=upload_dir), name="static")

# Routers
API_PREFIX = "/api"
app.include_router(public_tables_router, prefix=API_PREFIX)
app.include_router(public_orders_router, prefix=API_PREFIX)
app.include_router(admin_tables_router, prefix=API_PREFIX)
app.include_router(admin_categories_router, prefix=API_PREFIX)
app.include_router(admin_products_router, prefix=API_PREFIX)
app.include_router(admin_orders_router, prefix=API_PREFIX)
app.include_router(admin_sales_router, prefix=API_PREFIX)
app.include_router(admin_dashboard_router, prefix=API_PREFIX)

@app.get("/")
def root():
    return {"message": "Cafetería QR API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}

# Seed helper endpoint (solo en dev)
@app.post("/api/seed", tags=["dev"])
def seed():
    from app.database.session import SessionLocal
    from app.models.category import Category
    from app.models.product import Product
    from app.models.cafe_table import CafeTable
    db = SessionLocal()
    try:
        if db.query(Category).count() == 0:
            cats_data = [
                {"name": "Cafés", "display_order": 1},
                {"name": "Bebidas frías", "display_order": 2},
                {"name": "Desayunos", "display_order": 3},
                {"name": "Postres", "display_order": 4},
                {"name": "Snacks", "display_order": 5},
            ]
            cats = []
            for c in cats_data:
                cat = Category(name=c["name"], display_order=c["display_order"])
                db.add(cat)
                cats.append(cat)
            db.commit()
            for c in cats:
                db.refresh(c)
        else:
            cats = db.query(Category).all()

        if db.query(Product).count() == 0:
            cat_map = {c.name: c.id for c in cats}
            products = [
                {"name": "Cappuccino", "description": "Café espresso con leche espumada", "price_cop": 8500, "category": "Cafés", "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400"},
                {"name": "Latte", "description": "Espresso con leche vaporizada", "price_cop": 9000, "category": "Cafés", "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400"},
                {"name": "Americano", "description": "Café negro intenso", "price_cop": 6500, "category": "Cafés", "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"},
                {"name": "Mocaccino", "description": "Chocolate y café", "price_cop": 9500, "category": "Cafés", "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400"},
                {"name": "Jugo Natural", "description": "Naranja, mango o maracuyá", "price_cop": 7500, "category": "Bebidas frías", "image_url": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400"},
                {"name": "Croissant", "description": "Hojaldre recién horneado", "price_cop": 5500, "category": "Desayunos", "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400"},
                {"name": "Tostadas Avocado", "description": "Pan integral con aguacate y huevo", "price_cop": 12000, "category": "Desayunos", "image_url": "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400"},
                {"name": "Cheesecake", "description": "Tarta de queso con frutos rojos", "price_cop": 11000, "category": "Postres", "image_url": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400"},
                {"name": "Brownie", "description": "Chocolate intenso con nueces", "price_cop": 8000, "category": "Postres", "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400"},
                {"name": "Sándwich Club", "description": "Pollo, tocino y vegetales", "price_cop": 13500, "category": "Snacks", "image_url": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=400"},
            ]
            for p in products:
                prod = Product(
                    category_id=cat_map[p["category"]],
                    name=p["name"],
                    description=p["description"],
                    price_cop=p["price_cop"],
                    image_url=p["image_url"],
                    is_available=True,
                    allow_dine_in=True,
                    allow_takeaway=True
                )
                db.add(prod)
            db.commit()

        if db.query(CafeTable).count() == 0:
            for i in range(1, 9):
                t = CafeTable(name=f"Mesa {i}", number=i)
                db.add(t)
            db.commit()

        return {"detail": "Seed completado", "categories": db.query(Category).count(), "products": db.query(Product).count(), "tables": db.query(CafeTable).count()}
    finally:
        db.close()
