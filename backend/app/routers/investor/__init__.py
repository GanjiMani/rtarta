from fastapi import APIRouter
from . import (
    auth, profile, transactions, folios, mandates, idcw,
    complaints, notifications, disclosures, reports, service_requests,
    support, unclaimed, clients
)

# Create main router
router = APIRouter()

# Include all sub-routers with appropriate prefixes
router.include_router(auth.router, prefix="/auth", tags=["investor-auth"])
router.include_router(profile.router, prefix="/profile", tags=["investor-profile"])
router.include_router(transactions.router, prefix="/transactions", tags=["investor-transactions"])
router.include_router(folios.router, prefix="/folios", tags=["investor-folios"])
router.include_router(mandates.router, prefix="/mandates", tags=["investor-mandates"])
router.include_router(idcw.router, prefix="/idcw", tags=["investor-idcw"])
router.include_router(complaints.router, prefix="/complaints", tags=["investor-complaints"])
router.include_router(notifications.router, prefix="/notifications", tags=["investor-notifications"])
router.include_router(disclosures.router, prefix="/disclosures", tags=["investor-disclosures"])
router.include_router(reports.router, prefix="/reports", tags=["investor-reports"])
router.include_router(service_requests.router, prefix="/service-requests", tags=["investor-service-requests"])
router.include_router(support.router, prefix="/support", tags=["investor-support"])
router.include_router(unclaimed.router, prefix="/unclaimed", tags=["investor-unclaimed"])
router.include_router(clients.router, prefix="/clients", tags=["investor-clients"])

__all__ = ["router"]
