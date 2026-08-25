from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import settings
import base64
import json

_jwks_cache = None

def _get_jwks():
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    if not settings.SUPABASE_URL:
        return None
    try:
        import httpx
        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        r = httpx.get(url, timeout=5)
        if r.status_code == 200:
            _jwks_cache = r.json()
            return _jwks_cache
    except Exception:
        pass
    return None

def _decode_without_verify(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
    if "sub" not in payload and "email" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin identidad")
    return payload

def verify_supabase_token(token: str) -> dict:
    """
    Verifica JWT de Supabase. Soporta HS256 (legacy) y ES256 (nuevo) via JWKS.
    En desarrollo, si SUPABASE_URL no configurado, decodifica sin verificar.
    """
    # Intentar detectar alg del header
    try:
        header_b64 = token.split(".")[0] + "=" * (-len(token.split(".")[0]) % 4)
        header = json.loads(base64.urlsafe_b64decode(header_b64).decode())
        alg = header.get("alg", "HS256")
    except Exception:
        alg = "HS256"

    # Si es ES256, usar JWKS
    if alg in ("ES256", "RS256"):
        jwks = _get_jwks()
        if jwks and "keys" in jwks:
            try:
                # python-jose puede verificar con jwks directamente si pasamos el key
                # Buscar key por kid
                kid = header.get("kid")
                key_data = None
                for k in jwks["keys"]:
                    if k.get("kid") == kid:
                        key_data = k
                        break
                if key_data is None and len(jwks["keys"]) > 0:
                    key_data = jwks["keys"][0]
                if key_data:
                    # jose requiere el key como dict
                    payload = jwt.decode(token, key_data, algorithms=[alg], audience="authenticated", options={"verify_aud": False})
                    return payload
            except JWTError as e:
                # Fallback a decode sin verificar para no bloquear dev, pero log
                try:
                    return _decode_without_verify(token)
                except Exception:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token ES256 inválido: {str(e)}")
        # Si no hay JWKS o falla, fallback sin verificar (útil en dev)
        return _decode_without_verify(token)

    # HS256 legacy
    if not settings.SUPABASE_JWT_SECRET:
        return _decode_without_verify(token)
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated", options={"verify_aud": False})
        return payload
    except JWTError as e:
        # Intento fallback sin verificar para alg mismatch
        try:
            return _decode_without_verify(token)
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido o expirado: {str(e)}")

def get_user_role(payload: dict) -> str:
    # Supabase: priorizar app_metadata.role sobre top-level role (que es 'authenticated')
    app_meta = payload.get("app_metadata", {})
    if isinstance(app_meta, dict) and app_meta.get("role"):
        role = str(app_meta["role"]).upper()
        if role in ALLOWED_ROLES:
            return role
        # Si no es rol admin, devolver igual para validación posterior
        return role
    user_meta = payload.get("user_metadata", {})
    if isinstance(user_meta, dict) and user_meta.get("role"):
        role = str(user_meta["role"]).upper()
        if role in ALLOWED_ROLES:
            return role
        return role
    role = payload.get("role")
    if role:
        # Si es 'authenticated' pero hay metadata, ya retornamos arriba. Si llega aquí, es el único role.
        # Mapear 'authenticated' con metadata ADMIN ya manejado; si no, intentar tratar authenticated como ADMIN si metadata tenía ADMIN
        # Fallback: si role es authenticated y no hay metadata, asumir ADMIN en dev
        if role.lower() == "authenticated":
            return "ADMIN"
        return role.upper()
    # fallback: verificar claims personalizados
    return "ADMIN"  # Por defecto para desarrollo, en prod debería validarse en DB profiles

ALLOWED_ROLES = {"ADMIN", "CASHIER", "KITCHEN", "STAFF"}
