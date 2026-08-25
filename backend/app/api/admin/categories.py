from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies.auth import require_admin
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.models.product import Product

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])

@router.get("", response_model=list[CategoryResponse])
def list_all(db: Session = Depends(get_db), user=Depends(require_admin)):
    cats = db.query(Category).order_by(Category.display_order, Category.name).all()
    return cats

@router.post("", response_model=CategoryResponse)
def create(payload: CategoryCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    exists = db.query(Category).filter(Category.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Categoría ya existe")
    cat = Category(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.put("/{category_id}", response_model=CategoryResponse)
def update(category_id: str, payload: CategoryUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != cat.name:
        exists = db.query(Category).filter(Category.name == data["name"]).first()
        if exists:
            raise HTTPException(status_code=400, detail="Nombre ya en uso")
    for k, v in data.items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}")
def delete(category_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    has_products = db.query(Product).filter(Product.category_id == category_id, Product.is_active == True).first()
    if has_products:
        raise HTTPException(status_code=400, detail="No se puede eliminar categoría con productos activos. Desactive primero o reasigne.")
    db.delete(cat)
    db.commit()
    return {"detail": "Categoría eliminada"}
