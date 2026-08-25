from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from typing import Optional
import os
import uuid

router = APIRouter(prefix="/admin/products", tags=["admin-products"])

@router.get("", response_model=list[ProductResponse])
def list_all(db: Session = Depends(get_db), user=Depends(require_admin), category_id: Optional[str] = None, include_inactive: bool = False):
    q = db.query(Product)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if not include_inactive:
        q = q.filter(Product.is_active == True)
    products = q.order_by(Product.created_at.desc()).all()
    cat_map = {c.id: c.name for c in db.query(Category).all()}
    result = []
    for p in products:
        result.append(ProductResponse(
            id=p.id, category_id=p.category_id, name=p.name, description=p.description,
            price_cop=p.price_cop, image_url=p.image_url, image_path=p.image_path,
            is_available=p.is_available, allow_dine_in=p.allow_dine_in, allow_takeaway=p.allow_takeaway,
            is_active=p.is_active, created_at=p.created_at, updated_at=p.updated_at,
            category_name=cat_map.get(p.category_id)
        ))
    return result

@router.post("", response_model=ProductResponse)
def create(payload: ProductCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    cat = db.query(Category).filter(Category.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Categoría no encontrada")
    prod = Product(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return ProductResponse(
        id=prod.id, category_id=prod.category_id, name=prod.name, description=prod.description,
        price_cop=prod.price_cop, image_url=prod.image_url, image_path=prod.image_path,
        is_available=prod.is_available, allow_dine_in=prod.allow_dine_in, allow_takeaway=prod.allow_takeaway,
        is_active=prod.is_active, created_at=prod.created_at, updated_at=prod.updated_at,
        category_name=cat.name
    )

@router.get("/{product_id}", response_model=ProductResponse)
def get_one(product_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cat = db.query(Category).filter(Category.id == p.category_id).first()
    return ProductResponse(
        id=p.id, category_id=p.category_id, name=p.name, description=p.description,
        price_cop=p.price_cop, image_url=p.image_url, image_path=p.image_path,
        is_available=p.is_available, allow_dine_in=p.allow_dine_in, allow_takeaway=p.allow_takeaway,
        is_active=p.is_active, created_at=p.created_at, updated_at=p.updated_at,
        category_name=cat.name if cat else None
    )

@router.put("/{product_id}", response_model=ProductResponse)
def update(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        cat = db.query(Category).filter(Category.id == data["category_id"]).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Categoría no encontrada")
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    cat = db.query(Category).filter(Category.id == p.category_id).first()
    return ProductResponse(
        id=p.id, category_id=p.category_id, name=p.name, description=p.description,
        price_cop=p.price_cop, image_url=p.image_url, image_path=p.image_path,
        is_available=p.is_available, allow_dine_in=p.allow_dine_in, allow_takeaway=p.allow_takeaway,
        is_active=p.is_active, created_at=p.created_at, updated_at=p.updated_at,
        category_name=cat.name if cat else None
    )

@router.delete("/{product_id}")
def delete(product_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    # Soft delete
    p.is_active = False
    db.commit()
    return {"detail": "Producto desactivado"}

@router.post("/{product_id}/upload-image")
def upload_image(product_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Validar tipo y tamaño
    allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Tipo no permitido: {file.content_type}")
    content = file.file.read()
    max_bytes = 5 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="Imagen excede 5MB")
    
    # En producción esto iría a Supabase Storage. Para local, guardamos referencia simulada
    # Guardamos como base64 url temporal o guardamos en /tmp si disponible
    # Simplificamos: guardar image_url como placeholder y image_path
    filename = f"{uuid.uuid4()}_{file.filename}"
    # Si SUPABASE configurado, intentar subir; si no, guardar localmente en backend/uploads
    from app.core.config import settings
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        # Intentar supabase (opcional)
        try:
            import httpx
            # Not implemented fully - fallback
            pass
        except Exception:
            pass
    
    # Fallback local (no ideal para prod pero funcional)
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        f.write(content)
    # Guardar path relativo
    p.image_path = f"uploads/{filename}"
    # Para demo, image_url será ruta estática accesible si se sirve; por ahora usar path
    p.image_url = f"/static/{filename}"
    db.commit()
    db.refresh(p)
    return {"image_url": p.image_url, "image_path": p.image_path, "detail": "Imagen subida"}
