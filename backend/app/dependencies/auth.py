from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_supabase_token, get_user_role
from typing import Optional

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_dev_role: Optional[str] = Header(None, alias="X-Dev-Role"),
    db: Session = Depends(get_db)
):
    # Modo desarrollo: permitir header X-Dev-Role
    if x_dev_role and x_dev_role.upper() in ["ADMIN", "CASHIER", "KITCHEN", "STAFF"]:
        return {"id": "dev-user", "email": "dev@cafeteria.local", "role": x_dev_role.upper(), "payload": {}}
    
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado: token requerido")
    
    token = credentials.credentials
    payload = verify_supabase_token(token)
    role = get_user_role(payload)
    user_id = payload.get("sub", payload.get("user_id", "unknown"))
    email = payload.get("email", "")
    return {"id": user_id, "email": email, "role": role, "payload": payload}

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["ADMIN", "CASHIER", "KITCHEN", "STAFF"]:
        # Por ahora todos los roles admin pueden acceder, pero validamos
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol administrativo")
    # Si queremos solo ADMIN, descomentar:
    # if current_user["role"] != "ADMIN":
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol ADMIN")
    return current_user

def require_role(allowed_roles: list):
    def _checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Requiere uno de los roles: {allowed_roles}")
        return current_user
    return _checker
