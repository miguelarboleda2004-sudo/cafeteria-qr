from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings
import base64
import json

def verify_supabase_token(token: str) -> dict:
    """
    Verifica JWT de Supabase. En desarrollo, si SUPABASE_JWT_SECRET no está configurado,
    permite modo dev con fallback.
    """
    if not settings.SUPABASE_JWT_SECRET:
        # Dev mode: decodifica sin verificar firma (solo para desarrollo)
        try:
            # JWT format: header.payload.signature
            parts = token.split(".")
            if len(parts) != 3:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
            payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
            # Validar que tenga sub/email
            if "sub" not in payload and "email" not in payload:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin identidad")
            return payload
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido: {str(e)}")
    
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        return payload
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido o expirado: {str(e)}")

def get_user_role(payload: dict) -> str:
    # Supabase guarda role en app_metadata o user_metadata
    # Intentar múltiples ubicaciones
    role = payload.get("role")
    if role:
        return role.upper()
    app_meta = payload.get("app_metadata", {})
    if isinstance(app_meta, dict) and "role" in app_meta:
        return str(app_meta["role"]).upper()
    user_meta = payload.get("user_metadata", {})
    if isinstance(user_meta, dict) and "role" in user_meta:
        return str(user_meta["role"]).upper()
    # fallback: verificar claims personalizados
    return "ADMIN"  # Por defecto para desarrollo, en prod debería validarse en DB profiles

ALLOWED_ROLES = {"ADMIN", "CASHIER", "KITCHEN", "STAFF"}
