from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.db.base import BaseModel
from app.routers import admin
from app.routers import investor
from app.routers import amc
from app.routers import distributor
from app.routers import sebi
from app.routers.auth import router as auth_router

# Create database tables
BaseModel.metadata.create_all(bind=engine)

app = FastAPI(
    title="RTA Management System API",
    description="Registrar and Transfer Agent Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# app.include_router(auth_router, prefix="/api", tags=["authentication"])

# Admin routers
# Admin routers
app.include_router(admin.auth.router, prefix="/api", tags=["admin"])
app.include_router(admin.dashboard.router, tags=["admin"])
app.include_router(admin.transactions.router, tags=["admin"])
app.include_router(admin.approvals.router, tags=["admin"])
app.include_router(admin.nav_upload.router, tags=["admin"])
app.include_router(admin.audit_logs.router, tags=["admin"])
app.include_router(admin.idcw_management.router, tags=["admin"])
app.include_router(admin.reconciliation.router, tags=["admin"])
app.include_router(admin.unclaimed.router, tags=["admin"])
app.include_router(admin.user_management.router, tags=["admin"])
app.include_router(admin.system_settings.router, tags=["admin"])
app.include_router(admin.exceptions.router, tags=["admin"])
app.include_router(admin.reports.router, tags=["admin"])
app.include_router(admin.batch_jobs.router, tags=["admin"])
app.include_router(admin.system_alerts.router, tags=["admin"])
app.include_router(admin.user_sessions.router, tags=["admin"])
app.include_router(admin.kyc_verification.router, tags=["admin"])
app.include_router(admin.mandate_approvals.router, tags=["admin"])
app.include_router(admin.regulatory_filings.router, tags=["admin"])
app.include_router(admin.investor_management.router, tags=["admin"])

# Include other routers
app.include_router(investor.router, prefix="/api/investor", tags=["investor"])
app.include_router(amc.router, prefix="/api/amc", tags=["amc"])
app.include_router(distributor.router, prefix="/api/distributor", tags=["distributor"])
app.include_router(sebi.router, prefix="/api/sebi", tags=["sebi"])


@app.get("/")
async def root():
    return {
        "message": "RTA Management System API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
