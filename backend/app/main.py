import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import Base, engine
from app.db.seed_data import seed_database
from app.api.v1 import (
    auth, dashboard, cases, wallets, traces,
    transactions, vasp, cross_chain, alerts,
    evidence, reports, integrations, users, audit, settings as settings_api
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and demo seeds are present
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time Crypto Fraud Attribution and Investigation System for Authorized Law Enforcement Agencies",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local and networked investigation consoles
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(dashboard.router, prefix=api_v1)
app.include_router(cases.router, prefix=api_v1)
app.include_router(wallets.router, prefix=api_v1)
app.include_router(traces.router, prefix=api_v1)
app.include_router(transactions.router, prefix=api_v1)
app.include_router(vasp.router, prefix=api_v1)
app.include_router(cross_chain.router, prefix=api_v1)
app.include_router(alerts.router, prefix=api_v1)
app.include_router(evidence.router, prefix=api_v1)
app.include_router(reports.router, prefix=api_v1)
app.include_router(integrations.router, prefix=api_v1)
app.include_router(users.router, prefix=api_v1)
app.include_router(audit.router, prefix=api_v1)
app.include_router(settings_api.router, prefix=api_v1)

@app.get("/api/info")
def get_system_info():
    return {
        "system": settings.PROJECT_NAME,
        "classification": "RESTRICTED - LAW ENFORCEMENT INTELLIGENCE ONLY",
        "status": "OPERATIONAL",
        "api_docs": "/docs",
        "demo_mode": settings.DEMO_MODE,
        "supported_blockchains": ["BITCOIN", "ETHEREUM", "TRON", "BSC", "POLYGON", "SOLANA"]
    }

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "engine": "FastAPI + SQLAlchemy",
        "mode": "ACTIVE"
    }

# Mount static frontend production build if available
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return get_system_info()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
