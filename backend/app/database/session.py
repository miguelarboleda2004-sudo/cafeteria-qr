import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
if is_sqlite:
    # En Vercel sqlite debe estar en /tmp (read-only root)
    if settings.DATABASE_URL == "sqlite:///./cafeteria.db" and os.environ.get("VERCEL"):
        settings.DATABASE_URL = "sqlite:////tmp/cafeteria.db"
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"CRITICAL: engine creation failed for {settings.DATABASE_URL[:50]}... : {e}")
    # Fallback a sqlite temporal para que /health siga funcionando
    from sqlalchemy import create_engine as _ce
    engine = _ce("sqlite:////tmp/fallback.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
