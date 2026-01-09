from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, Date, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class AdminRole(enum.Enum):
    """RTA Admin Role Hierarchy"""
    rta_ceo = "rta_ceo"
    rta_coo = "rta_coo"
    compliance_head = "compliance_head"
    operations_manager = "operations_manager"
    senior_executive = "senior_executive"
    executive = "executive"
    data_entry_operator = "data_entry_operator"
    customer_service = "customer_service"


class ApprovalStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    under_review = "under_review"
    auto_approved = "auto_approved"


class ApprovalType(enum.Enum):
    transaction = "transaction"
    kyc_verification = "kyc_verification"
    bank_mandate = "bank_mandate"
    high_value_transaction = "high_value_transaction"
    data_correction = "data_correction"
    system_change = "system_change"
    emergency_processing = "emergency_processing"


class BatchJobStatus(enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class BatchJobType(enum.Enum):
    nav_upload = "nav_upload"
    idcw_processing = "idcw_processing"
    reconciliation = "reconciliation"
    statement_generation = "statement_generation"
    regulatory_reporting = "regulatory_reporting"
    unclaimed_aging = "unclaimed_aging"
    sip_processing = "sip_processing"
    swp_processing = "swp_processing"
    stp_processing = "stp_processing"


class SystemAlertType(enum.Enum):
    critical = "critical"
    warning = "warning"
    info = "info"
    security = "security"


class AuditLogAction(enum.Enum):
    create = "create"
    update = "update"
    delete = "delete"
    view = "view"
    approve = "approve"
    reject = "reject"
    login = "login"
    logout = "logout"
    export = "export"
    import_data = "import_data"


class AdminUser(BaseModel):
    """RTA Admin User with role-based access"""
    
    __tablename__ = "admin_users"
    
    # User Identification
    admin_id = Column(String(20), unique=True, nullable=False, index=True)  # ADM001, ADM002
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    
    # Role and Permissions
    role = Column(Enum(AdminRole), nullable=False, index=True)
    department = Column(String(100))  # Operations, Compliance, IT, etc.
    designation = Column(String(100))
    
    # Access Control
    permissions = Column(JSON)  # JSON array of permission strings
    access_level = Column(String(20), default="standard")  # standard, elevated, full
    
    # Work Assignment
    assigned_amcs = Column(JSON)  # Array of AMC IDs this admin can access
    transaction_limit = Column(DECIMAL(15, 2))  # Maximum transaction amount they can approve
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime)
    last_activity = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    approvals = relationship("Approval", back_populates="admin_user")
    audit_logs = relationship("AuditLog", back_populates="admin_user")
    
    def __repr__(self):
        return f"<AdminUser(admin_id={self.admin_id}, role={self.role.value})>"


class Approval(BaseModel):
    """Multi-level approval workflow for transactions and requests"""
    
    __tablename__ = "approvals"
    
    approval_id = Column(String(20), unique=True, nullable=False, index=True)  # APR001
    approval_type = Column(Enum(ApprovalType), nullable=False, index=True)
    
    # Request Details
    request_id = Column(String(50), nullable=False, index=True)  # Transaction ID, KYC ID, etc.
    request_data = Column(JSON)  # Full request details as JSON
    
    # Approval Chain
    current_level = Column(Integer, default=1, nullable=False)
    total_levels = Column(Integer, default=1, nullable=False)
    approver_id = Column(String(20), ForeignKey("admin_users.admin_id"), nullable=False)
    
    # Status
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.pending, nullable=False, index=True)
    approval_date = Column(DateTime)
    rejection_reason = Column(Text)
    
    # Priority
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    sla_deadline = Column(DateTime)
    
    # Audit
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Relationships
    admin_user = relationship("AdminUser", back_populates="approvals")
    
    def __repr__(self):
        return f"<Approval(approval_id={self.approval_id}, type={self.approval_type.value}, status={self.status.value})>"


class AuditLog(BaseModel):
    """Comprehensive audit trail for all system activities"""
    
    __tablename__ = "audit_logs"
    
    log_id = Column(String(20), unique=True, nullable=False, index=True)  # LOG001
    action = Column(Enum(AuditLogAction), nullable=False, index=True)
    
    # User Information
    user_id = Column(Integer, ForeignKey("users.id"))
    admin_id = Column(String(20), ForeignKey("admin_users.admin_id"))
    user_email = Column(String(255))
    user_role = Column(String(50))
    
    # Entity Information
    entity_type = Column(String(50))  # transaction, investor, folio, etc.
    entity_id = Column(String(50), index=True)
    
    # Action Details
    action_details = Column(JSON)  # Before/after values, changes made
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    api_endpoint = Column(String(200))
    request_method = Column(String(10))
    
    # Result
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Relationships
    admin_user = relationship("AdminUser", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(log_id={self.log_id}, action={self.action.value}, timestamp={self.timestamp})>"


class SystemAlert(BaseModel):
    """System-wide alerts and notifications"""
    
    __tablename__ = "system_alerts"
    
    alert_id = Column(String(20), unique=True, nullable=False, index=True)  # ALT001
    alert_type = Column(Enum(SystemAlertType), nullable=False, index=True)
    
    # Alert Details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100))  # system, transaction, compliance, etc.
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    acknowledged_at = Column(DateTime)
    
    # Priority
    priority = Column(String(20), default="normal")  # low, normal, high, critical
    
    # Metadata
    alert_metadata = Column(JSON)  # Additional alert data
    resolved_at = Column(DateTime)
    
    def __repr__(self):
        return f"<SystemAlert(alert_id={self.alert_id}, type={self.alert_type.value}, title={self.title})>"


class BatchJob(BaseModel):
    """Batch job management for automated processes"""
    
    __tablename__ = "batch_jobs"
    
    job_id = Column(String(20), unique=True, nullable=False, index=True)  # JOB001
    job_type = Column(Enum(BatchJobType), nullable=False, index=True)
    job_name = Column(String(255), nullable=False)
    
    # Schedule
    scheduled_at = Column(DateTime, nullable=False, index=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Status
    status = Column(Enum(BatchJobStatus), default=BatchJobStatus.pending, nullable=False, index=True)
    
    # Execution Details
    parameters = Column(JSON)  # Job parameters
    input_file_path = Column(String(500))
    output_file_path = Column(String(500))
    
    # Results
    records_processed = Column(Integer, default=0)
    records_successful = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_log = Column(Text)
    
    # Execution
    executed_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    execution_time_seconds = Column(Integer)
    
    def __repr__(self):
        return f"<BatchJob(job_id={self.job_id}, type={self.job_type.value}, status={self.status.value})>"


class Reconciliation(BaseModel):
    """Reconciliation records for transaction matching"""
    
    __tablename__ = "reconciliations"
    
    reconciliation_id = Column(String(20), unique=True, nullable=False, index=True)  # REC001
    reconciliation_type = Column(String(50), nullable=False)  # daily, monthly, nav, etc.
    
    # Period
    reconciliation_date = Column(Date, nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # AMC/Scheme
    amc_id = Column(String(10), ForeignKey("amc_master.amc_id"))
    scheme_id = Column(String(10), ForeignKey("scheme_master.scheme_id"))
    
    # Matching Results
    total_transactions = Column(Integer, default=0)
    matched_transactions = Column(Integer, default=0)
    unmatched_transactions = Column(Integer, default=0)
    discrepancy_amount = Column(DECIMAL(15, 2), default=0.00)
    
    # Status
    status = Column(String(20), default="pending")  # pending, in_progress, completed, failed
    is_reconciled = Column(Boolean, default=False, nullable=False)
    
    # Results
    reconciliation_results = Column(JSON)  # Detailed matching results
    exception_count = Column(Integer, default=0)
    
    # Audit
    performed_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    performed_at = Column(DateTime)
    
    def __repr__(self):
        return f"<Reconciliation(reconciliation_id={self.reconciliation_id}, date={self.reconciliation_date}, status={self.status})>"


class Exception(BaseModel):
    """Exception tracking for failed transactions and errors"""
    
    __tablename__ = "exceptions"
    
    exception_id = Column(String(20), unique=True, nullable=False, index=True)  # EXC001
    exception_type = Column(String(50), nullable=False, index=True)  # transaction_failed, nav_mismatch, etc.
    
    # Related Entities
    transaction_id = Column(String(15), ForeignKey("transaction_history.transaction_id"))
    investor_id = Column(String(10), ForeignKey("investor_master.investor_id"))
    folio_number = Column(String(15), ForeignKey("folio_holdings.folio_number"))
    
    # Exception Details
    error_code = Column(String(20))
    error_message = Column(Text, nullable=False)
    exception_data = Column(JSON)  # Full exception context
    
    # Status
    status = Column(String(20), default="open")  # open, in_progress, resolved, closed
    priority = Column(String(20), default="normal")  # low, normal, high, critical
    
    # Resolution
    resolved_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Timestamps
    occurred_at = Column(DateTime, nullable=False, index=True)
    
    def __repr__(self):
        return f"<Exception(exception_id={self.exception_id}, type={self.exception_type}, status={self.status})>"


class UserSession(BaseModel):
    """User session tracking and management"""
    
    __tablename__ = "user_sessions"
    
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    admin_id = Column(String(20), ForeignKey("admin_users.admin_id"))
    
    # Session Details
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    device_type = Column(String(50))  # desktop, mobile, tablet
    browser = Column(String(100))
    os = Column(String(100))
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    login_time = Column(DateTime, nullable=False, index=True)
    last_activity = Column(DateTime, nullable=False)
    logout_time = Column(DateTime)
    
    # Security
    location = Column(String(100))  # City/Country if available
    is_suspicious = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<UserSession(session_id={self.session_id}, user_id={self.user_id}, is_active={self.is_active})>"


class SystemSetting(BaseModel):
    """System-wide configuration settings"""
    
    __tablename__ = "system_settings"
    
    setting_key = Column(String(100), unique=True, nullable=False, primary_key=True)
    setting_value = Column(Text, nullable=False)
    setting_type = Column(String(50))  # string, number, boolean, json
    category = Column(String(50))  # transaction, nav, idcw, security, etc.
    
    # Metadata
    description = Column(Text)
    is_encrypted = Column(Boolean, default=False)
    is_readonly = Column(Boolean, default=False)
    
    # Audit
    updated_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    updated_at = Column(DateTime, nullable=False)
    
    def __repr__(self):
        return f"<SystemSetting(key={self.setting_key}, category={self.category})>"


class RegulatoryFiling(BaseModel):
    """Regulatory filing and compliance records"""
    
    __tablename__ = "regulatory_filings"
    
    filing_id = Column(String(20), unique=True, nullable=False, index=True)  # FIL001
    filing_type = Column(String(50), nullable=False)  # sebi_report, tax_filing, etc.
    
    # Period
    filing_period = Column(String(50))  # Q1 2024, Annual 2024, etc.
    filing_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date, nullable=False)
    
    # Status
    status = Column(String(20), default="pending")  # pending, submitted, approved, rejected
    submission_date = Column(Date)
    
    # Documents
    document_path = Column(String(500))
    filing_data = Column(JSON)  # Filing data as JSON
    
    # Audit
    filed_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    approved_by = Column(String(20), ForeignKey("admin_users.admin_id"))
    
    def __repr__(self):
        return f"<RegulatoryFiling(filing_id={self.filing_id}, type={self.filing_type}, status={self.status})>"


