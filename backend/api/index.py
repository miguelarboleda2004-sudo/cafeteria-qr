# Vercel serverless entry for FastAPI
# Vercel expects `app` variable at api/index.py
from app.main import app

# Vercel will call app as ASGI
# No extra code needed
