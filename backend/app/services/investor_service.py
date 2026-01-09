from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from app.models.investor import Investor
from app.models.user import User
from app.models.mandate import BankAccount, Nominee
from app.models.folio import Folio, FolioStatus
from app.models.transaction import Transaction
from app.models.scheme import Scheme
from app.core.security import get_password_hash
from app.schemas.investor import InvestorCreate, BankAccountCreate, NomineeCreate
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
        user = User(
            email=investor.email,
            full_name=investor.full_name,
            role="investor",
            investor_id=investor.investor_id,
            hashed_password=get_password_hash(password),
            is_active=True
        )

        self.db.add(user)
        return user

    def get_investor_profile(self, investor_id: str) -> Dict[str, Any]:
        """Get complete investor profile with related data"""
        if not investor_id:
            raise ValueError("Investor ID is required")

        # Query investor object
        investor_obj = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()

        if not investor_obj:
            raise ValueError(f"Investor not found for ID: {investor_id}")

        # Helper function to safely convert enum to string
        def enum_to_string(value):
            if value is None:
                return None
            if hasattr(value, 'value'):
                return value.value
            str_val = str(value)
            if '.' in str_val:
                return str_val.split('.')[-1]
            return str_val
        
        # Convert to dictionary (avoid enum access to prevent serialization issues)
        investor = {
            "investor_id": investor_obj.investor_id,
            "pan_number": investor_obj.pan_number,
            "full_name": investor_obj.full_name,
            "date_of_birth": investor_obj.date_of_birth.isoformat() if investor_obj.date_of_birth else None,
            "gender": enum_to_string(investor_obj.gender),
            "email": investor_obj.email,
            "mobile_number": investor_obj.mobile_number,
            "alternate_mobile": investor_obj.alternate_mobile,
            "address_line1": investor_obj.address_line1,
            "address_line2": investor_obj.address_line2,
            "city": investor_obj.city,
            "state": investor_obj.state,
            "pincode": investor_obj.pincode,
            "country": investor_obj.country,
            "kyc_status": enum_to_string(investor_obj.kyc_status),
            "occupation": enum_to_string(investor_obj.occupation),
            "income_slab": enum_to_string(investor_obj.income_slab),
            "marital_status": enum_to_string(investor_obj.marital_status),
            "investor_type": enum_to_string(investor_obj.investor_type)
        }

        # Get bank accounts
        bank_accounts_list = []
        try:
            bank_accounts = self.db.query(
                BankAccount.id,
                BankAccount.account_number,
                BankAccount.bank_name,
                BankAccount.ifsc_code,
                BankAccount.branch_name,
                BankAccount.account_holder_name,
                BankAccount.is_primary,
                BankAccount.is_verified
            ).filter(BankAccount.investor_id == investor_id).all()

            # Convert to dict format
            for account in bank_accounts:
                bank_accounts_list.append({
                    "id": account.id,
                    "account_number": account.account_number or "",
                    "bank_name": account.bank_name or "",
                    "ifsc_code": account.ifsc_code or "",
                    "branch_name": account.branch_name or "",
                    "account_holder_name": account.account_holder_name or "",
                    "is_primary": account.is_primary if account.is_primary is not None else False,
                    "is_verified": account.is_verified if account.is_verified is not None else False
                })
        except Exception as e:
            logger.warning(f"Failed to fetch bank accounts for investor {investor_id}: {e}")
            bank_accounts_list = []

        # Get nominees
        nominees_list = []
        try:
            nominees = self.db.query(
                Nominee.id,
                Nominee.nominee_name,
                Nominee.nominee_relationship,
                Nominee.date_of_birth,
                Nominee.allocation_percentage
            ).filter(Nominee.investor_id == investor_id).all()

            # Convert to dict format
            for nominee in nominees:
                nominees_list.append({
                    "id": nominee.id,
                    "full_name": nominee.nominee_name or "",
                    "relationship": nominee.nominee_relationship or "",
                    "date_of_birth": nominee.date_of_birth.isoformat() if nominee.date_of_birth else None,
                    "allocation_percentage": float(nominee.allocation_percentage) if nominee.allocation_percentage else 0.0
                })
        except Exception as e:
            logger.warning(f"Failed to fetch nominees for investor {investor_id}: {e}")
            nominees_list = []

        # Get portfolio summary (simplified to avoid any potential issues)
        # Initialize default values
        total_investment = 0.0
        current_value = 0.0
        folio_count = 0
        folio_list = []
        
        # Try to fetch folio data, but don't fail if it errors
        try:
            # Query full Folio objects for calculations
            folios_data = self.db.query(Folio).filter(
                Folio.investor_id == investor_id,
                Folio.status == FolioStatus.active
            ).all()

            if folios_data:
                try:
                    total_investment = sum(float(f.total_investment) if f.total_investment else 0.0 for f in folios_data)
                    current_value = sum(float(f.total_value) if f.total_value else 0.0 for f in folios_data)
                    folio_count = len(folios_data)
                except (ValueError, TypeError) as calc_error:
                    logger.warning(f"Error calculating folio totals for investor {investor_id}: {calc_error}")
                    # Keep default values of 0.0
        except Exception as e:
            # If folio query fails for any reason (table doesn't exist, connection issue, etc.), 
            # log it but continue - folio data is not critical for profile display
            logger.debug(f"Could not fetch folio data for investor {investor_id} (this is optional): {e}")
            # Continue with default values - this is not critical for profile display

        return {
            "investor": investor,
            "bank_accounts": bank_accounts_list,
            "nominees": nominees_list,
            "folios": folio_list,
            "total_folios": folio_count,
            "total_investment": total_investment,
            "current_value": current_value
        }

    def update_investor_profile(self, investor_id: str, update_data: Dict[str, Any]) -> Investor:
        """Update investor profile information"""
        investor = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()
        if not investor:
            raise ValueError("Investor not found")

        # Update allowed fields
        allowed_fields = [
            'full_name', 'mobile_number', 'alternate_mobile',
            'address_line1', 'address_line2', 'city', 'state', 'pincode',
            'occupation', 'income_slab', 'marital_status'
        ]

        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                setattr(investor, field, value)

        # Flush to send changes to database (but don't commit - let router handle commit)
        self.db.flush()
        self.db.refresh(investor)  # Refresh to get updated data
        
        return investor

    def add_bank_account(self, investor_id: str, bank_data: BankAccountCreate) -> BankAccount:
        """Add bank account for investor"""
        # Check if account number already exists for this investor
        existing = self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id,
            BankAccount.account_number == bank_data.account_number
        ).first()

        if existing:
            raise ValueError("Bank account already exists")

        # If this is the first account or marked as primary, set as primary
        existing_accounts = self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id
        ).count()

        is_primary = bank_data.is_primary if hasattr(bank_data, 'is_primary') else (existing_accounts == 0)

        if is_primary:
            # Remove primary flag from other accounts
            self.db.query(BankAccount).filter(
                BankAccount.investor_id == investor_id
            ).update({"is_primary": False})

        bank_account = BankAccount(
            investor_id=investor_id,
            **bank_data.dict(),
            is_primary=is_primary
        )

        self.db.add(bank_account)
        return bank_account

    def update_bank_account(self, investor_id: str, account_id: int, update_data: Dict[str, Any]) -> BankAccount:
        """Update bank account details"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        # Update allowed fields (including fields that frontend sends)
        allowed_fields = [
            'account_number', 'account_holder_name', 'bank_name', 'branch_name', 
            'ifsc_code', 'bank_address', 'city', 'state', 'pincode'
        ]

        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                setattr(bank_account, field, value)

        self.db.flush()
        self.db.refresh(bank_account)
        return bank_account

    def set_primary_bank_account(self, investor_id: str, account_id: int) -> BankAccount:
        """Set bank account as primary"""
        bank_account = self.db.query(BankAccount).filter(
            BankAccount.id == account_id,
            BankAccount.investor_id == investor_id
        ).first()

        if not bank_account:
            raise ValueError("Bank account not found")

        # Remove primary flag from all accounts
        self.db.query(BankAccount).filter(
            BankAccount.investor_id == investor_id
        ).update({"is_primary": False})

        # Set this account as primary
        bank_account.is_primary = True

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
        from datetime import date
        bank_account.verified_at = date.today()
        # In production, verified_by would be set to current admin/user ID
        # For now, we'll set it to a placeholder
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
            # The schema uses 'relationship' but model uses 'nominee_relationship'
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
        """Update nominee details"""
        nominee = self.db.query(Nominee).filter(
            Nominee.id == nominee_id,
            Nominee.investor_id == investor_id
        ).first()

        if not nominee:
            raise ValueError("Nominee not found")

        # Update allowed fields
        allowed_fields = [
            'nominee_name', 'nominee_pan', 'relationship', 'nominee_relationship',
            'date_of_birth', 'gender', 'allocation_percentage', 
            'mobile_number', 'email', 'address',
            'guardian_name', 'guardian_pan', 'guardian_relation'
        ]

        for field, value in update_data.items():
            # Map 'relationship' to 'nominee_relationship' if needed
            if field == 'relationship':
                field = 'nominee_relationship'
            if field in allowed_fields and value is not None:
                setattr(nominee, field, value)

        self.db.flush()
        self.db.refresh(nominee)
        return nominee

    def delete_nominee(self, investor_id: str, nominee_id: int) -> None:
        """Delete nominee"""
        nominee = self.db.query(Nominee).filter(
            Nominee.id == nominee_id,
            Nominee.investor_id == investor_id
        ).first()

        if not nominee:
            raise ValueError("Nominee not found")

        self.db.delete(nominee)

    def get_investor_dashboard_data(self, investor_id: str) -> Dict[str, Any]:
        """Get dashboard data for investor"""
        # Get portfolio folios with scheme details
        folios_query = self.db.query(
            Folio.folio_number,
            Folio.scheme_id,
            Folio.total_units,
            Folio.total_investment,
            Folio.total_value,
            Folio.amc_id
        ).filter(
            Folio.investor_id == investor_id,
            Folio.status == FolioStatus.active
        ).all()

        # Get scheme details for each folio
        portfolio_list = []
        total_investment = 0.0
        current_value = 0.0
        
        for folio in folios_query:
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            if scheme:
                # Calculate current value from current NAV (always recalculate for accuracy)
                current_nav = float(scheme.current_nav) if scheme.current_nav else 0.0
                total_units = float(folio.total_units) if folio.total_units else 0.0
                calculated_total_value = total_units * current_nav
                
                portfolio_list.append({
                    "folio_number": folio.folio_number,
                    "scheme_id": folio.scheme_id,
                    "scheme_name": scheme.scheme_name,
                    "total_units": total_units,
                    "total_investment": float(folio.total_investment) if folio.total_investment else 0.0,
                    "total_value": calculated_total_value,  # Use calculated value from current NAV
                    "current_nav": current_nav,
                    "last_nav": current_nav
                })
                total_investment += float(folio.total_investment) if folio.total_investment else 0.0
                current_value += calculated_total_value

        # Recent transactions (select specific fields to avoid relationships)
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

        # Active SIPs (select specific fields to avoid relationships)
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
                "frequency": sip.frequency,
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

    def validate_investor_kyc(self, investor_id: str) -> bool:
        """Validate if investor has complete KYC"""
        investor = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()
        if not investor:
            return False

        # Check basic KYC requirements
        required_fields = [
            investor.pan_number,
            investor.full_name,
            investor.date_of_birth,
            investor.address_line1,
            investor.city,
            investor.state,
            investor.pincode
        ]

        return all(required_fields) and investor.kyc_status.value == "verified"

    def get_investor_folios(self, investor_id: str) -> List[Folio]:
        """Get all folios for investor"""
        return self.db.query(Folio).filter(Folio.investor_id == investor_id).all()

    def get_folios(self, investor_id: str, active_only: bool = False, with_units_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get all folios for investor as dictionaries
        
        Args:
            investor_id: The investor ID
            active_only: If True, only return folios with active status
            with_units_only: If True, only return folios with units > 0 (for redemption)
        
        Returns:
            List of folio dictionaries with scheme details
        """
        if not investor_id:
            logger.error("get_folios called with empty investor_id")
            return []
            
        logger.info(f"Fetching folios for investor: {investor_id} (active_only={active_only}, with_units_only={with_units_only})")
        
        try:
            # Build query with filters
            query = self.db.query(Folio).filter(Folio.investor_id == investor_id)
            
            # Apply status filter if needed
            if active_only:
                query = query.filter(Folio.status == FolioStatus.active)
            elif with_units_only:
                # For redemption (with_units_only), we want only active folios
                query = query.filter(Folio.status == FolioStatus.active)
            else:
                # Exclude closed folios by default
                query = query.filter(Folio.status != FolioStatus.closed)
            
            # Apply units filter if needed (for redemption scenarios)
            if with_units_only:
                # Filter for folios with units > 0
                # Since total_units is DECIMAL(15,4) and nullable=False, we can safely compare
                from decimal import Decimal
                # Filter for folios where total_units > 0
                # Use Decimal comparison to ensure accurate filtering
                query = query.filter(Folio.total_units > Decimal('0.0001'))  # Use small threshold to handle rounding
                logger.debug(f"Applied with_units_only filter: total_units > 0.0001, status=active")
            
            folios = query.all()
            
            # If with_units_only filter was applied, do an additional Python-side filter as safety
            # This ensures we catch any edge cases where SQL comparison might not work as expected
            if with_units_only:
                from decimal import Decimal
                original_count = len(folios)
                # Use a small threshold to handle floating point precision issues
                threshold = Decimal('0.0001')
                folios = [f for f in folios if f.total_units is not None and f.total_units > threshold]
                if original_count != len(folios):
                    logger.warning(f"Python-side filter removed {original_count - len(folios)} folios after SQL query")
                # Log each folio that passed the filter for debugging
                for f in folios:
                    logger.debug(f"Folio {f.folio_number} passed filter: total_units={f.total_units}, status={f.status}")
            
            logger.info(f"Found {len(folios)} folios in database for investor {investor_id} (with_units_only={with_units_only})")
            
            # Additional debug logging
            if with_units_only and len(folios) == 0:
                # Check if there are folios without the units filter
                all_folios = self.db.query(Folio).filter(Folio.investor_id == investor_id).all()
                active_folios = [f for f in all_folios if f.status == FolioStatus.active]
                logger.warning(f"No folios found with units > 0, but found {len(all_folios)} total folios, {len(active_folios)} active folios")
                for f in all_folios[:10]:  # Limit to first 10 for logging
                    status_val = f.status.value if hasattr(f.status, 'value') else str(f.status)
                    units_val = float(f.total_units) if f.total_units else 0.0
                    logger.warning(f"Folio {f.folio_number}: status={status_val}, total_units={units_val}, is_active={f.status == FolioStatus.active}, has_units={units_val > 0}")
            
            folio_list = []
            for folio in folios:
                try:
                    # Get scheme details
                    scheme = self.db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
                    
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
                    logger.debug(f"Added folio {folio.folio_number}: {folio_dict['scheme_name']} - Units: {folio_dict['total_units']}")
                    
                except Exception as e:
                    logger.error(f"Error processing folio {folio.folio_number}: {e}")
                    continue
            
            logger.info(f"Returning {len(folio_list)} folios for investor {investor_id}")
            return folio_list
            
        except Exception as e:
            logger.error(f"Error fetching folios for investor {investor_id}: {e}", exc_info=True)
            return []

    def get_investor_transactions(self, investor_id: str, limit: int = 50) -> List[Transaction]:
        """Get transaction history for investor"""
        return self.db.query(Transaction).filter(
            Transaction.investor_id == investor_id
        ).order_by(Transaction.transaction_date.desc()).limit(limit).all()

