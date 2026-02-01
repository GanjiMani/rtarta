# Import all models in dependency order to resolve relationships properly

from .user import User
from .amc import AMC
from .scheme import Scheme, NAVHistory
from .investor import Investor
from .mandate import BankAccount, Nominee, SIPRegistration, SWPRegistration, STPRegistration
from .folio import Folio
from .transaction import Transaction
from .document import Document
from .unclaimed import UnclaimedAmount
from .service_request import ServiceRequest, ServiceRequestType, ServiceRequestStatus, ServiceRequestPriority
from .notification import Notification, NotificationType, NotificationPriority
from .complaint import Complaint, ComplaintStatus, ComplaintCategory
from .support import SupportTicket, TicketStatus, TicketPriority
from .disclosure import Disclosure, DisclosureCategory
from .distributor import Distributor, investor_agents
from .admin import (
    AdminUser, Approval, AuditLog, SystemAlert, BatchJob, Reconciliation,
    Exception, UserSession, SystemSetting, RegulatoryFiling
)

# Import all models into the namespace
__all__ = [
    "User", "AMC", "Scheme", "NAVHistory", "Investor",
    "BankAccount", "Nominee", "SIPRegistration", "SWPRegistration", "STPRegistration",
    "Folio", "Transaction", "Document", "UnclaimedAmount", "ServiceRequest",
    "Notification",    "NotificationType",
    "NotificationPriority",
    "Complaint",
    "ComplaintStatus",
    "ComplaintCategory",
    "SupportTicket",
    "TicketStatus",
    "TicketPriority",
    "Disclosure",
    "DisclosureCategory",
    "Distributor",
    "investor_agents",
    "AdminUser", "Approval", "AuditLog", "SystemAlert", "BatchJob", "Reconciliation",
    "Exception", "UserSession", "SystemSetting", "RegulatoryFiling"
]
