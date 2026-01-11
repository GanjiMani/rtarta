from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from app.models.investor import Investor
from app.models.user import User, UserRole
from app.models.mandate import BankAccount, Nominee
from app.models.folio import Folio, FolioStatus
from app.models.transaction import Transaction
from app.models.scheme import Scheme
from app.core.security import get_password_hash
from app.schemas.investor import InvestorCreate, BankAccountCreate, NomineeCreate, MandateRegistration
from app.services.mandate_service import MandateService
import logging

logger = logging.getLogger(__name__)


class InvestorService:
    """Service for investor profile and account management"""

    def __init__(self, db: Session):
        self.db = db

    def generate_investor_id(self) -> str:
        """Generate unique investor ID (I001, I002, etc.)"""
        result = self.db.query(func.max(Investor.id)).scalar()
        next_id = (result or 0) + 1
        return f"I{next_id:03d}"

    def create_investor(self, investor_data: InvestorCreate) -> Investor:
        """Create new investor profile"""
        # Check if PAN already exists
        existing = self.db.query(Investor).filter(Investor.pan_number == investor_data.pan_number).first()
        if existing:
            raise ValueError("Investor with this PAN already exists")

        # Check if email already exists
        existing_email = self.db.query(Investor).filter(Investor.email == investor_data.email).first()
        if existing_email:
            raise ValueError("Investor with this email already exists")

        # Generate investor ID
        investor_id = self.generate_investor_id()

        # Create investor
        investor = Investor(
            investor_id=investor_id,
            **investor_data.dict()
        )

        self.db.add(investor)
        self.db.flush()  # Get the ID without committing

        return investor

    def create_user_for_investor(self, investor: Investor, password: str) -> User:
        """Create user account for investor"""
        # Create user
        user = User(
            email=investor.email,
            full_name=investor.full_name,
            role=UserRole.investor,
            investor_id=investor.investor_id,
            is_active=True
        )
        user.set_password(password)

        self.db.add(user)
        self.db.flush()

        return user

    def get_investor_profile(self, investor_id: str) -> Dict[str, Any]:
        """Get complete investor profile with related data"""
        investor = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()
        if not investor:
            raise ValueError(f"Investor {investor_id} not found")

        # Get bank accounts
        bank_accounts = self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id
        ).all()

        # Get nominees
        nominees = self.db.query(Nominee).filter(
            Nominee.investor_id == investor_id
        ).all()

        # Convert to dict
        profile = {
            "investor_id": investor.investor_id,
            "pan_number": investor.pan_number,
            "full_name": investor.full_name,
            "date_of_birth": investor.date_of_birth.isoformat() if investor.date_of_birth else None,
            "gender": investor.gender.value if hasattr(investor.gender, 'value') else str(investor.gender),
            "investor_type": investor.investor_type.value if hasattr(investor.investor_type, 'value') else str(investor.investor_type),
            "email": investor.email,
            "mobile_number": investor.mobile_number,
            "alternate_mobile": investor.alternate_mobile,
            "address_line1": investor.address_line1,
            "address_line2": investor.address_line2,
            "city": investor.city,
            "state": investor.state,
            "pincode": investor.pincode,
            "country": investor.country,
            "occupation": investor.occupation.value if investor.occupation and hasattr(investor.occupation, 'value') else str(investor.occupation) if investor.occupation else None,
            "income_slab": investor.income_slab.value if investor.income_slab and hasattr(investor.income_slab, 'value') else str(investor.income_slab) if investor.income_slab else None,
            "kyc_status": investor.kyc_status.value if hasattr(investor.kyc_status, 'value') else str(investor.kyc_status),
            "bank_accounts": [self._bank_account_to_dict(ba) for ba in bank_accounts],
            "nominees": [self._nominee_to_dict(n) for n in nominees]
        }

        return profile

    def update_investor_profile(self, investor_id: str, update_data: Dict[str, Any]) -> Investor:
        """Update investor profile"""
        investor = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()
        if not investor:
            raise ValueError(f"Investor {investor_id} not found")

        for key, value in update_data.items():
            if hasattr(investor, key) and value is not None:
                setattr(investor, key, value)

        self.db.flush()
        return investor

    def add_bank_account(self, investor_id: str, bank_data: BankAccountCreate) -> BankAccount:
        """Add bank account for investor"""
        bank_account = BankAccount(
            investor_id=investor_id,
            **bank_data.dict()
        )

        self.db.add(bank_account)
        self.db.flush()
        self.db.refresh(bank_account)
        return bank_account

    def update_bank_account(self, investor_id: str, account_id: int, update_data: Dict[str, Any]) -> BankAccount:
        """Update bank account"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        for key, value in update_data.items():
            if hasattr(bank_account, key) and value is not None:
                setattr(bank_account, key, value)

        self.db.flush()
        self.db.refresh(bank_account)
        return bank_account

    def delete_bank_account(self, investor_id: str, account_id: int) -> bool:
        """Delete bank account"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        self.db.delete(bank_account)
        self.db.flush()
        return True

    def get_bank_accounts(self, investor_id: str) -> List[BankAccount]:
        """Get all bank accounts for investor"""
        return self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id
        ).all()

    def set_primary_bank_account(self, investor_id: str, account_id: int) -> BankAccount:
        """Set primary bank account"""
        # Unset all primary accounts
        self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id
        ).update({"is_primary": False})

        # Set new primary
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        bank_account.is_primary = True
        self.db.flush()
        self.db.refresh(bank_account)

        return bank_account

    def verify_bank_account(self, investor_id: str, account_id: int) -> BankAccount:
        """Verify bank account"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        # Mark account as verified
        bank_account.is_verified = True
        bank_account.verified_at = date.today()
        bank_account.verified_by = "system"

        self.db.flush()
        self.db.refresh(bank_account)
        return bank_account

    def add_nominee(self, investor_id: str, nominee_data: NomineeCreate) -> Nominee:
        """Add nominee for investor"""
        # Check total allocation percentage
        existing_nominees = self.db.query(Nominee).filter(Nominee.investor_id == investor_id).all()
        total_allocation = sum(n.allocation_percentage for n in existing_nominees) + nominee_data.allocation_percentage

        if total_allocation > 100:
            raise ValueError("Total nominee allocation cannot exceed 100%")

        # Map relationship field from schema to model field name
        nominee_dict = nominee_data.dict()
        if 'relationship' in nominee_dict:
            nominee_dict['nominee_relationship'] = nominee_dict.pop('relationship')
        
        nominee = Nominee(
            investor_id=investor_id,
            **nominee_dict
        )

        self.db.add(nominee)
        self.db.flush()
        self.db.refresh(nominee)
        return nominee

    def update_nominee(self, investor_id: str, nominee_id: int, update_data: Dict[str, Any]) -> Nominee:
        """Update nominee"""
        nominee = self.db.query(Nominee).filter(
            Nominee.id == nominee_id,
            Nominee.investor_id == investor_id
        ).first()

        if not nominee:
            raise ValueError("Nominee not found")

        for key, value in update_data.items():
            # Map relationship field from schema to model field name
            actual_key = key
            if key == 'relationship':
                actual_key = 'nominee_relationship'
            
            if hasattr(nominee, actual_key) and value is not None:
                setattr(nominee, actual_key, value)

        self.db.flush()
        self.db.refresh(nominee)
        return nominee

    def delete_nominee(self, investor_id: str, nominee_id: int) -> bool:
        """Delete nominee"""
        nominee = self.db.query(Nominee).filter(
            Nominee.id == nominee_id,
            Nominee.investor_id == investor_id
        ).first()

        if not nominee:
            raise ValueError("Nominee not found")

        self.db.delete(nominee)
        self.db.flush()
        return True

    def get_nominees(self, investor_id: str) -> List[Nominee]:
        """Get all nominees for investor"""
        return self.db.query(Nominee).filter(
            Nominee.investor_id == investor_id
        ).all()

    def get_investor_dashboard_data(self, investor_id: str) -> Dict[str, Any]:
        """Get dashboard data for investor"""
        # Optimize: EAGER LOAD Scheme relationship
        from sqlalchemy.orm import joinedload
        
        folios_query = self.db.query(Folio).options(joinedload(Folio.scheme)).filter(
            Folio.investor_id == investor_id,
            Folio.status == FolioStatus.active
        ).all()

        # Get scheme details for each folio (now eager loaded)
        portfolio_list = []
        total_investment = 0.0
        current_value = 0.0
        
        for folio in folios_query:
            scheme = folio.scheme
            if scheme:
                # Calculate current value from current NAV
                current_nav = float(scheme.current_nav) if scheme.current_nav else 0.0
                total_units = float(folio.total_units) if folio.total_units else 0.0
                calculated_total_value = total_units * current_nav
                
                portfolio_list.append({
                    "folio_number": folio.folio_number,
                    "scheme_id": folio.scheme_id,
                    "scheme_name": scheme.scheme_name,
                    "scheme_type": scheme.scheme_type.value if hasattr(scheme.scheme_type, 'value') else str(scheme.scheme_type), # Added for dashboard filtering
                    "total_units": total_units,
                    "total_investment": float(folio.total_investment) if folio.total_investment else 0.0,
                    "total_value": calculated_total_value,
                    "current_nav": current_nav,
                    "last_nav": current_nav
                })
                total_investment += float(folio.total_investment) if folio.total_investment else 0.0
                current_value += calculated_total_value

        # Recent transactions
        recent_transactions = self.db.query(
            Transaction.transaction_id,
            Transaction.transaction_type,
            Transaction.amount,
            Transaction.transaction_date,
            Transaction.status,
            Transaction.scheme_id
        ).filter(
            Transaction.investor_id == investor_id
        ).order_by(Transaction.transaction_date.desc()).limit(5).all()

        # Convert transactions to dict
        transactions_list = []
        for txn in recent_transactions:
            transactions_list.append({
                "transaction_id": txn.transaction_id,
                "transaction_type": txn.transaction_type.value if hasattr(txn.transaction_type, 'value') else str(txn.transaction_type),
                "amount": float(txn.amount),
                "transaction_date": txn.transaction_date.isoformat() if txn.transaction_date else None,
                "status": txn.status.value if hasattr(txn.status, 'value') else str(txn.status),
                "scheme_id": txn.scheme_id
            })

        # Active SIPs
        from app.models.mandate import SIPRegistration, SIPStatus
        active_sips_data = self.db.query(
            SIPRegistration.id,
            SIPRegistration.scheme_id,
            SIPRegistration.amount,
            SIPRegistration.frequency,
            SIPRegistration.next_installment_date
        ).filter(
            SIPRegistration.investor_id == investor_id,
            SIPRegistration.status == SIPStatus.active
        ).limit(5).all()

        # Convert SIPs to dict
        sips_list = []
        for sip in active_sips_data:
            sips_list.append({
                "id": sip.id,
                "scheme_id": sip.scheme_id,
                "amount": float(sip.amount),
                "frequency": sip.frequency.value if hasattr(sip.frequency, 'value') else str(sip.frequency),
                "next_installment_date": sip.next_installment_date.isoformat() if sip.next_installment_date else None
            })

        return {
            "portfolio": portfolio_list,
            "portfolio_summary": {
                "total_investment": total_investment,
                "current_value": current_value,
                "gain_loss": current_value - total_investment,
                "folio_count": len(portfolio_list)
            },
            "recent_transactions": transactions_list,
            "active_sips": sips_list
        }

    def get_investor_folios(self, investor_id: str) -> List[Folio]:
        """Get all folios for investor"""
        return self.db.query(Folio).filter(Folio.investor_id == investor_id).all()

    def get_folios(self, investor_id: str, active_only: bool = False, with_units_only: bool = False) -> List[Dict[str, Any]]:
        """Get all folios for investor as dictionaries with eager loading"""
        if not investor_id:
            logger.error("get_folios called with empty investor_id")
            return []
            
        logger.info(f"Fetching folios for investor: {investor_id} (active_only={active_only}, with_units_only={with_units_only})")
        
        try:
            # Optimize: EAGER LOAD Scheme relationship in a single query
            # This fixes the N+1 query problem where we were querying Scheme for every Folio
            from sqlalchemy.orm import joinedload
            
            query = self.db.query(Folio).options(joinedload(Folio.scheme)).filter(Folio.investor_id == investor_id)
            
            # Apply status filter if needed
            if active_only:
                query = query.filter(Folio.status == FolioStatus.active)
            elif with_units_only:
                query = query.filter(Folio.total_units > 0)
            
            folios = query.all()
            
            # Additional python-side filtering if needed (though DB filtering is better if possible)
            if with_units_only:
                folios = [f for f in folios if float(f.total_units or 0) > 0]
            
            folio_list = []
            for folio in folios:
                try:
                    # Scheme is now already loaded on the folio object
                    scheme = folio.scheme
                    
                    if not scheme:
                        logger.warning(f"Scheme {folio.scheme_id} not found for folio {folio.folio_number}")
                        continue
                    
                    # Convert enum status to string
                    status_value = folio.status.value if hasattr(folio.status, 'value') else str(folio.status)
                    
                    # Calculate current value if NAV is available
                    current_value = float(folio.total_units * scheme.current_nav) if folio.total_units and scheme.current_nav else 0.0
                    
                    folio_dict = {
                        "folio_number": folio.folio_number,
                        "investor_id": folio.investor_id,
                        "scheme_id": folio.scheme_id,
                        "scheme_name": scheme.scheme_name,
                        "scheme_type": scheme.scheme_type.value if hasattr(scheme.scheme_type, 'value') else str(scheme.scheme_type),
                        "amc_id": folio.amc_id,
                        "amc_name": folio.amc.amc_name if folio.amc else None, # Assuming AMC can be lazy loaded or we add it to joinedload too
                        "total_units": float(folio.total_units) if folio.total_units else 0.0,
                        "current_nav": float(scheme.current_nav) if scheme.current_nav else 0.0,
                        "total_value": current_value,
                        "total_investment": float(folio.total_investment) if folio.total_investment else 0.0,
                        "average_cost_per_unit": float(folio.average_cost_per_unit) if folio.average_cost_per_unit else 0.0,
                        "exit_load_percentage": float(scheme.exit_load_percentage) if scheme.exit_load_percentage else 0.0,
                        "status": status_value,
                        "last_transaction_date": folio.last_transaction_date.isoformat() if folio.last_transaction_date else None
                    }
                    folio_list.append(folio_dict)
                    
                except Exception as e:
                    logger.error(f"Error processing folio {folio.folio_number}: {e}")
                    continue
            
            logger.info(f"Returning {len(folio_list)} folios for investor {investor_id}")
            return folio_list
            
        except Exception as e:
            logger.error(f"Error fetching folios for investor {investor_id}: {e}", exc_info=True)
            return []

    def get_folio_summary(self, investor_id: str) -> Dict[str, Any]:
        """Get folio summary for investor"""
        folios = self.db.query(Folio).filter(
            Folio.investor_id == investor_id,
            Folio.status == FolioStatus.active
        ).all()

        total_units = 0.0
        total_value = 0.0
        folio_list = []

        for folio in folios:
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            if scheme:
                current_nav = float(scheme.current_nav) if scheme.current_nav else 0.0
                units = float(folio.total_units) if folio.total_units else 0.0
                value = units * current_nav

                folio_list.append({
                    "folio_number": folio.folio_number,
                    "scheme_id": folio.scheme_id,
                    "scheme_name": scheme.scheme_name,
                    "total_units": units,
                    "current_nav": current_nav,
                    "total_value": value
                })
                total_units += units
                total_value += value

        return {
            "total_units": total_units,
            "total_value": total_value,
            "folios": folio_list
        }

    def get_folio_transactions(self, investor_id: str, folio_number: str) -> List[Transaction]:
        """Get transactions for a specific folio"""
        folio = self.db.query(Folio).filter(
            Folio.folio_number == folio_number,
            Folio.investor_id == investor_id
        ).first()

        if not folio:
            raise ValueError(f"Folio {folio_number} not found")

        return self.db.query(Transaction).filter(
            Transaction.folio_number == folio_number
        ).order_by(Transaction.transaction_date.desc()).all()

    def create_bank_mandate(self, investor_id: str, bank_data: Dict[str, Any]) -> BankAccount:
        """Create bank mandate (delegated to MandateService)"""
        mandate_service = MandateService(self.db)
        
        # Prepare registration data
        reg_data = MandateRegistration(
            bank_account_id=bank_data.get('bank_account_id') or bank_data.get('id'),
            mandate_type=bank_data.get('mandate_type', 'net_banking'),
            mandate_amount_limit=bank_data.get('mandate_amount_limit', 100000),
            mandate_expiry_date=bank_data.get('mandate_expiry_date'),
            upi_id=bank_data.get('upi_id')
        )
        
        return mandate_service.register_mandate(investor_id, reg_data)

    def update_bank_mandate(self, investor_id: str, mandate_id: int, update_data: Dict[str, Any]) -> BankAccount:
        """Update bank mandate (delegated to MandateService)"""
        mandate_service = MandateService(self.db)
        # For simplicity, we use update_mandate_status if status is provided
        if 'mandate_status' in update_data:
            return mandate_service.update_mandate_status(mandate_id, update_data['mandate_status'])
        
        # Otherwise fall back to manual update on model
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == mandate_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank mandate not found")

        from app.models.mandate import MandateType, MandateStatus
        for key, value in update_data.items():
            if hasattr(bank_account, key) and value is not None:
                if key == 'mandate_type' and isinstance(value, str):
                    setattr(bank_account, key, MandateType[value.lower()])
                elif key == 'mandate_status' and isinstance(value, str):
                    setattr(bank_account, key, MandateStatus[value.lower()])
                else:
                    setattr(bank_account, key, value)

        self.db.flush()
        return bank_account

    def delete_bank_mandate(self, investor_id: str, mandate_id: int) -> bool:
        """Delete bank mandate (deactivates mandate on bank account)"""
        # mandate_id is actually bank_account_id
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == mandate_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank mandate not found")

        # Deactivate mandate instead of deleting bank account
        from app.models.mandate import MandateStatus
        bank_account.mandate_status = MandateStatus.cancelled
        bank_account.mandate_id = None
        bank_account.mandate_expiry_date = None

        self.db.flush()
        return True

    def _bank_account_to_dict(self, bank_account: BankAccount) -> Dict[str, Any]:
        """Convert bank account to dictionary"""
        return {
            "id": bank_account.id,
            "account_number": bank_account.account_number,
            "account_holder_name": bank_account.account_holder_name,
            "bank_name": bank_account.bank_name,
            "ifsc_code": bank_account.ifsc_code,
            "branch": bank_account.branch_name or bank_account.branch,  # Support both field names
            "branch_name": bank_account.branch_name,
            "account_type": bank_account.account_type.value if hasattr(bank_account.account_type, 'value') else str(bank_account.account_type),
            "is_primary": bank_account.is_primary,
            "is_verified": bank_account.is_verified,
            "verified_at": bank_account.verified_at.isoformat() if bank_account.verified_at else None,
            "mandate_type": bank_account.mandate_type.value if bank_account.mandate_type and hasattr(bank_account.mandate_type, 'value') else str(bank_account.mandate_type) if bank_account.mandate_type else None,
            "mandate_status": bank_account.mandate_status.value if bank_account.mandate_status and hasattr(bank_account.mandate_status, 'value') else str(bank_account.mandate_status) if bank_account.mandate_status else None,
            "mandate_id": bank_account.mandate_id
        }

    def _nominee_to_dict(self, nominee: Nominee) -> Dict[str, Any]:
        """Convert nominee to dictionary"""
        return {
            "id": nominee.id,
            "nominee_name": nominee.nominee_name,
            "nominee_relationship": nominee.nominee_relationship,
            "date_of_birth": nominee.date_of_birth.isoformat() if nominee.date_of_birth else None,
            "allocation_percentage": float(nominee.allocation_percentage) if nominee.allocation_percentage else 0.0,
            "guardian_name": nominee.guardian_name,
            "guardian_relation": nominee.guardian_relation
        }
