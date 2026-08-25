import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.category import Category
from app.models.product import Product
from app.models.cafe_table import CafeTable

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    cat = Category(name="Cafés", display_order=1)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    # products
    p1 = Product(category_id=cat.id, name="Cappuccino", price_cop=8500, is_available=True, allow_dine_in=True, allow_takeaway=True)
    p2 = Product(category_id=cat.id, name="Solo Local", price_cop=5000, is_available=True, allow_dine_in=True, allow_takeaway=False)
    p3 = Product(category_id=cat.id, name="Agotado", price_cop=4000, is_available=False, allow_dine_in=True, allow_takeaway=True)
    db.add_all([p1, p2, p3])
    t = CafeTable(name="Mesa 1", number=1)
    db.add(t)
    db.commit()
    db.refresh(t)
    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)
    # store ids
    pytest.cat_id = cat.id
    pytest.p1_id = p1.id
    pytest.p2_id = p2.id
    pytest.p3_id = p3.id
    pytest.table_code = t.public_code
    pytest.table_id = t.id
    db.close()
    yield

def test_create_order_success():
    resp = client.post("/api/public/orders", json={
        "table_code": pytest.table_code,
        "customer_name": "Miguel",
        "order_type": "DINE_IN",
        "items": [{"product_id": pytest.p1_id, "quantity": 2}]
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total_cop"] == 17000
    assert data["status"] == "PENDING_PAYMENT"

def test_takeaway_blocked_product():
    resp = client.post("/api/public/orders", json={
        "table_code": pytest.table_code,
        "customer_name": "Ana",
        "order_type": "TAKEAWAY",
        "items": [{"product_id": pytest.p2_id, "quantity": 1}]
    })
    assert resp.status_code == 400
    assert "para llevar" in resp.text.lower()

def test_unavailable_product_blocked():
    resp = client.post("/api/public/orders", json={
        "table_code": pytest.table_code,
        "customer_name": "Jose",
        "order_type": "DINE_IN",
        "items": [{"product_id": pytest.p3_id, "quantity": 1}]
    })
    assert resp.status_code == 400

def test_price_recalculation():
    # Intenta enviar precio manipulado - el backend recalcula, no hay campo precio pero verificamos que total es correcto aunque quantity sea 1
    resp = client.post("/api/public/orders", json={
        "table_code": pytest.table_code,
        "customer_name": "Test",
        "order_type": "DINE_IN",
        "items": [{"product_id": pytest.p1_id, "quantity": 1}]
    })
    assert resp.json()["total_cop"] == 8500

def test_order_status_transitions():
    resp = client.post("/api/public/orders", json={
        "table_code": pytest.table_code,
        "customer_name": "Trans",
        "order_type": "DINE_IN",
        "items": [{"product_id": pytest.p1_id, "quantity": 1}]
    })
    order_id = resp.json()["id"]
    headers = {"X-Dev-Role": "ADMIN"}
    # Pay
    r = client.post(f"/api/admin/orders/{order_id}/pay", json={"payment_method": "CASH"}, headers=headers)
    assert r.status_code == 200, r.text
    # Start preparation
    r = client.post(f"/api/admin/orders/{order_id}/start-preparation", headers=headers)
    assert r.status_code == 200
    # Ready
    r = client.post(f"/api/admin/orders/{order_id}/ready", headers=headers)
    assert r.status_code == 200
    # Deliver
    r = client.post(f"/api/admin/orders/{order_id}/deliver", headers=headers)
    assert r.status_code == 200
    # Mesa debe volver a AVAILABLE
    r = client.get("/api/admin/tables", headers=headers)
    table = [t for t in r.json() if t["id"] == pytest.table_id][0]
    assert table["status"] == "AVAILABLE"

def test_invalid_table_code():
    resp = client.post("/api/public/orders", json={
        "table_code": "INVALIDO",
        "customer_name": "X",
        "order_type": "DINE_IN",
        "items": [{"product_id": pytest.p1_id, "quantity": 1}]
    })
    assert resp.status_code == 404
