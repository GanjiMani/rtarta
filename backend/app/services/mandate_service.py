from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
import logging
import uuid
from app.models.mandate import BankAccount, MandateType, MandateStatus
from app.schemas.investor import MandateRegistration, MandateUpdate

logger = logging.getLogger(__name__)

class MandateService:
    """Service for managing bank mandates (UPI, eNACH, physical)"""

    def __init__(self, db: Session):
        self.db = db

    def register_mandate(self, investor_id: str, registration_data: MandateRegistration) -> BankAccount:
        """Register a new mandate for a bank account"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == registration_data.bank_account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found or does not belong to investor")

        # Update mandate fields
        bank_account.mandate_type = MandateType[registration_data.mandate_type.lower()]
        bank_account.mandate_amount_limit = registration_data.mandate_amount_limit
        bank_account.mandate_expiry_date = registration_data.mandate_expiry_date
        
        if registration_data.upi_id:
            bank_account.upi_id = registration_data.upi_id

        # Initialize registration status
        bank_account.mandate_status = MandateStatus.inactive
        bank_account.mandate_registration_date = date.today()
        
        # In a real system, this would trigger an external API call to the NPCI/Bank
        # Here we generate a mock UMRN if it doesn't exist
        if not bank_account.mandate_umrn:
            bank_account.mandate_umrn = f"MOCK{uuid.uuid4().hex[:10].upper()}"

        self.db.flush()
        self.db.refresh(bank_account)
        
        logger.info(f"Mandate registered for bank account {bank_account.id} with UMRN {bank_account.mandate_umrn}")
        return bank_account

    def update_mandate_status(self, bank_account_id: int, status: str) -> BankAccount:
        """Update mandate status (internal / mock simulation)"""
        bank_account = self.db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
        if not bank_account:
            raise ValueError("Bank account not found")

        try:
            bank_account.mandate_status = MandateStatus[status.lower()]
        except KeyError:
            raise ValueError(f"Invalid mandate status: {status}")

        self.db.flush()
        self.db.refresh(bank_account)
        logger.info(f"Mandate {bank_account.mandate_umrn} status updated to {status}")
        return bank_account

    def verify_mandate(self, investor_id: str, bank_account_id: int) -> BankAccount:
        """Verify mandate (simulation of confirmation from bank)"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == bank_account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Mandate registration not found")

        # Mock successful verification
        bank_account.mandate_status = MandateStatus.active
        
        # If no mandate ID from bank yet, generate one
        if not bank_account.mandate_id:
            bank_account.mandate_id = f"BANK{uuid.uuid4().hex[:8].upper()}"

        self.db.flush()
        self.db.refresh(bank_account)
        return bank_account

    def get_mandate_status(self, investor_id: str, bank_account_id: int) -> Dict[str, Any]:
        """Check status of a mandate"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == bank_account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Mandate not found")

        return {
            "bank_account_id": bank_account.id,
            "bank_name": bank_account.bank_name,
            "status": bank_account.mandate_status.value if bank_account.mandate_status else None,
            "umrn": bank_account.mandate_umrn,
            "limit": float(bank_account.mandate_amount_limit) if bank_account.mandate_amount_limit else 0,
            "type": bank_account.mandate_type.value if bank_account.mandate_type else None,
            "expiry": bank_account.mandate_expiry_date.isoformat() if bank_account.mandate_expiry_date else None
        }

    def is_mandate_ready(self, bank_account_id: int, amount: Decimal) -> bool:
        """Check if mandate is active and has sufficient limit"""
        bank_account = self.db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
        if not bank_account:
            return False

        if bank_account.mandate_status != MandateStatus.active:
            return False

        if bank_account.mandate_amount_limit and amount > bank_account.mandate_amount_limit:
            return False

        if bank_account.mandate_expiry_date and date.today() > bank_account.mandate_expiry_date:
            return False

        return True
