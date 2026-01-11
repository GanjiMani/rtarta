# Import all models in dependency order to resolve relationships properly

from .user import User
from .amc import AMC
from .scheme import Scheme
from .investor import Investor
from .mandate import BankAccount, Nominee, SIPRegistration, SWPRegistration, STPRegistration
from .folio import Folio
from .transaction import Transaction
from .document import Document
from .unclaimed import UnclaimedAmount
from .service_request import ServiceRequest, ServiceRequestType, ServiceRequestStatus, ServiceRequestPriority
from .notification import Notification, NotificationType, NotificationPriority
from .admin import (
    AdminUser, Approval, AuditLog, SystemAlert, BatchJob, Reconciliation,
    Exception, UserSession, SystemSetting, RegulatoryFiling
)

# Import all models into the namespace
__all__ = [
    "User", "AMC", "Scheme", "Investor",
    "BankAccount", "Nominee", "SIPRegistration", "SWPRegistration", "STPRegistration",
    "Folio", "Transaction", "Document", "UnclaimedAmount", "ServiceRequest",
    "Notification", "NotificationType", "NotificationPriority",
    "AdminUser", "Approval", "AuditLog", "SystemAlert", "BatchJob", "Reconciliation",
    "Exception", "UserSession", "SystemSetting", "RegulatoryFiling"
]



