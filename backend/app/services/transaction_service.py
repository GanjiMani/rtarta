from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import date, datetime, timedelta
from decimal import Decimal
import logging

try:
    from dateutil.relativedelta import relativedelta
except ImportError:
    # Fallback if dateutil is not installed
    relativedelta = None

from app.models.transaction import Transaction, TransactionType, TransactionStatus, PaymentMode
from app.models.folio import Folio, FolioStatus
from app.models.scheme import Scheme
from app.models.investor import Investor
from app.models.mandate import (
    SIPRegistration, SWPRegistration, STPRegistration,
    SIPFrequency, SIPStatus, MandateType
)
from app.models.unclaimed import UnclaimedAmount
from app.core.config import settings
from app.services.mandate_service import MandateService

logger = logging.getLogger(__name__)


class TransactionService:
    """Service for processing transactions and managing portfolio"""

    def __init__(self, db: Session):
        self.db = db

    def generate_transaction_id(self) -> str:
        """Generate unique transaction ID (T001, T002, etc.)"""
        result = self.db.query(func.max(Transaction.id)).scalar()
        next_id = (result or 0) + 1
        return f"T{next_id:03d}"

    def generate_folio_number(self) -> str:
        """Generate unique folio number (F001, F002, etc.)"""
        result = self.db.query(func.max(Folio.id)).scalar()
        next_id = (result or 0) + 1
        return f"F{next_id:03d}"

    def get_or_create_folio(self, investor_id: str, scheme_id: str, lock: bool = False) -> Folio:
        """Get existing folio or create new one for investor-scheme combination"""
        # Handle both S001 and SCH001 format
        actual_scheme_id = None
        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        
        if not scheme:
            # Try alternative format (S001 <-> SCH001)
            alt_scheme_id = "SCH" + scheme_id[1:] if scheme_id.startswith("S") and len(scheme_id) == 4 else scheme_id.replace("SCH", "S")
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == alt_scheme_id).first()
            if scheme:
                actual_scheme_id = alt_scheme_id
        else:
            actual_scheme_id = scheme_id
        
        if not scheme:
            raise ValueError(f"Scheme {scheme_id} not found")
        
        # Check if folio exists
        query = self.db.query(Folio).filter(
            Folio.investor_id == investor_id,
            Folio.scheme_id == actual_scheme_id,
            Folio.amc_id == scheme.amc_id
        )
        
        if lock:
            query = query.with_for_update()
            
        folio = query.first()

        if not folio:
            # Create new folio
            folio_number = self.generate_folio_number()
            folio = Folio(
                folio_number=folio_number,
                investor_id=investor_id,
                amc_id=scheme.amc_id,
                scheme_id=actual_scheme_id,
                total_units=Decimal('0.0000'),
                current_nav=scheme.current_nav,
                total_value=Decimal('0.00'),
                total_investment=Decimal('0.00'),
                average_cost_per_unit=Decimal('0.0000'),
                status=FolioStatus.active
            )
            self.db.add(folio)
            self.db.flush()
        else:
            # Update current_nav for existing folio
            folio.current_nav = scheme.current_nav

        return folio

    def process_fresh_purchase(
        self,
        investor_id: str,
        scheme_id: str,
        amount: Decimal,
        plan: str,
        payment_mode: str
    ) -> Transaction:
        """Process fresh purchase transaction"""
        # Handle both S001 and SCH001 format
        actual_scheme_id = None
        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        
        if not scheme:
            # Try alternative format
            alt_scheme_id = "SCH" + scheme_id[1:] if scheme_id.startswith("S") and len(scheme_id) == 4 else scheme_id.replace("SCH", "S")
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == alt_scheme_id).first()
            if scheme:
                actual_scheme_id = alt_scheme_id
        else:
            actual_scheme_id = scheme_id
        
        if not scheme:
            raise ValueError(f"Scheme {scheme_id} not found")
        
        if not scheme.is_open_for_investment:
            raise ValueError(f"Scheme {actual_scheme_id} is not open for investment")
        
        if amount < scheme.minimum_investment:
            raise ValueError(f"Amount must be at least {scheme.minimum_investment}")

        # Get or create folio
        folio = self.get_or_create_folio(investor_id, actual_scheme_id, lock=True)

        # Calculate units
        nav = scheme.current_nav
        units = amount / nav

        # Generate transaction ID
        transaction_id = self.generate_transaction_id()

        # Create transaction
        payment_mode_enum = PaymentMode[payment_mode] if isinstance(payment_mode, str) and payment_mode in PaymentMode.__members__ else PaymentMode.net_banking
        
        transaction = Transaction(
            transaction_id=transaction_id,
            investor_id=investor_id,
            folio_number=folio.folio_number,
            scheme_id=actual_scheme_id,
            amc_id=scheme.amc_id,
            transaction_type=TransactionType.fresh_purchase,
            transaction_date=date.today(),
            amount=amount,
            nav_per_unit=nav,
            units=units,
            status=TransactionStatus.completed,
            payment_mode=payment_mode_enum,
            processing_date=date.today(),
            completion_date=date.today()
        )
        self.db.add(transaction)
        self.db.flush()

        # Update folio
        folio.current_nav = nav
        folio.total_units += units
        folio.total_investment += amount
        folio.total_value = folio.total_units * folio.current_nav
        folio.average_cost_per_unit = folio.total_investment / folio.total_units if folio.total_units > 0 else Decimal('0')
        folio.last_transaction_date = date.today()
        folio.transaction_count += 1

        self.db.flush()
        return transaction

    def process_redemption(
        self,
        folio_number: str,
        units: Optional[Decimal] = None,
        amount: Optional[Decimal] = None,
        all_units: bool = False
    ) -> Transaction:
        """Process redemption transaction"""
        # Lock the folio row to prevent concurrent modifications (ACID)
        folio = self.db.query(Folio).filter(Folio.folio_number == folio_number).with_for_update().first()
        if not folio:
            raise ValueError(f"Folio {folio_number} not found")

        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
        if not scheme:
            raise ValueError(f"Scheme {folio.scheme_id} not found")

        if not scheme.is_open_for_redemption:
            raise ValueError(f"Scheme {folio.scheme_id} is not open for redemption")

        # Determine units to redeem
        if all_units:
            redeem_units = folio.total_units
        elif units:
            redeem_units = units
            if redeem_units > folio.total_units:
                raise ValueError("Insufficient units for redemption")
        elif amount:
            nav = scheme.current_nav
            redeem_units = amount / nav
            if redeem_units > folio.total_units:
                raise ValueError("Insufficient units for redemption")
        else:
            raise ValueError("Must specify units, amount, or all_units")

        if redeem_units <= 0:
            raise ValueError("Redemption amount must be greater than 0")

        nav = scheme.current_nav
        redeem_amount = redeem_units * nav

        # Calculate exit load if applicable
        exit_load_amount = Decimal('0.00')
        if scheme.exit_load_percentage and scheme.exit_load_period_days:
            # Simplified: assume exit load applies if holding period is less than required
            exit_load_amount = (redeem_amount * scheme.exit_load_percentage) / 100

        net_amount = redeem_amount - exit_load_amount

        # Generate transaction ID
        transaction_id = self.generate_transaction_id()

        # Create transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            investor_id=folio.investor_id,
            folio_number=folio.folio_number,
            scheme_id=folio.scheme_id,
            amc_id=folio.amc_id,
            transaction_type=TransactionType.redemption,
            transaction_date=date.today(),
            amount=net_amount,
            nav_per_unit=nav,
            units=-redeem_units,  # Negative for redemption
            status=TransactionStatus.completed,
            exit_load_amount=exit_load_amount,
            processing_date=date.today(),
            completion_date=date.today()
        )
        self.db.add(transaction)
        self.db.flush()

        # Update folio
        folio.current_nav = nav
        folio.total_units -= redeem_units
        if folio.total_units <= 0:
            folio.total_units = Decimal('0.0000')
            folio.status = FolioStatus.closed
        folio.total_investment -= (redeem_units * folio.average_cost_per_unit) if folio.average_cost_per_unit > 0 else Decimal('0')
        if folio.total_investment < 0:
            folio.total_investment = Decimal('0.00')
        folio.total_value = folio.total_units * folio.current_nav
        folio.average_cost_per_unit = folio.total_investment / folio.total_units if folio.total_units > 0 else Decimal('0')
        folio.last_transaction_date = date.today()
        folio.transaction_count += 1

        self.db.flush()
        return transaction

    def setup_sip(
        self,
        investor_id: str,
        scheme_id: str,
        amount: Decimal,
        frequency: str,
        start_date: date,
        bank_account_id: int,
        end_date: Optional[date] = None,
        installments: Optional[int] = None
    ) -> SIPRegistration:
        """Setup SIP registration"""
        # Handle both S001 and SCH001 format
        actual_scheme_id = None
        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        
        if not scheme:
            alt_scheme_id = "SCH" + scheme_id[1:] if scheme_id.startswith("S") and len(scheme_id) == 4 else scheme_id.replace("SCH", "S")
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == alt_scheme_id).first()
            if scheme:
                actual_scheme_id = alt_scheme_id
        else:
            actual_scheme_id = scheme_id
        
        if not scheme:
            raise ValueError(f"Scheme {scheme_id} not found")

        # Get or create folio
        folio = self.get_or_create_folio(investor_id, actual_scheme_id)

        # Validate Mandate
        mandate_service = MandateService(self.db)
        if not mandate_service.is_mandate_ready(bank_account_id, amount):
            # Check if mandate exists but is inactive
            status_info = mandate_service.get_mandate_status(investor_id, bank_account_id)
            if status_info["status"] != "active":
                raise ValueError(f"Bank mandate is not active (current status: {status_info['status']}). Please activate the mandate first.")
            if amount > status_info["limit"]:
                raise ValueError(f"SIP amount {amount} exceeds mandate limit of {status_info['limit']}")
            raise ValueError("Bank mandate is not ready or expired.")

        # Convert frequency to enum (lowercase)
        freq_lower = frequency.lower() if isinstance(frequency, str) else str(frequency).lower()
        try:
            freq_enum = SIPFrequency[freq_lower]
        except KeyError:
            raise ValueError(f"Invalid frequency: {frequency}")

        # Generate SIP registration ID
        result = self.db.query(func.max(SIPRegistration.id)).scalar()
        next_id = (result or 0) + 1
        registration_id = f"SIP{next_id:03d}"

        # Calculate next installment date
        next_installment_date = start_date

        # Create SIP registration
        sip_reg = SIPRegistration(
            investor_id=investor_id,
            folio_number=folio.folio_number,
            scheme_id=actual_scheme_id,
            bank_account_id=bank_account_id,
            registration_id=registration_id,
            amount=amount,
            frequency=freq_enum,
            start_date=start_date,
            end_date=end_date,
            number_of_installments=installments,
            status=SIPStatus.active,
            next_installment_date=next_installment_date,
            mandate_type=MandateType.net_banking  # Default mandate type
        )
        self.db.add(sip_reg)
        self.db.flush()

        # Process first installment if start_date is today or in the past
        if start_date <= date.today():
            try:
                self.process_sip_installment(registration_id)
            except Exception as e:
                logger.warning(f"Failed to process first SIP installment: {e}")

        return sip_reg

    def setup_swp(
        self,
        investor_id: str,
        folio_number: str,
        amount: Decimal,
        frequency: str,
        start_date: date,
        bank_account_id: int,
        end_date: Optional[date] = None,
        installments: Optional[int] = None
    ) -> SWPRegistration:
        """Setup SWP registration"""
        folio = self.db.query(Folio).filter(Folio.folio_number == folio_number).first()
        if not folio:
            raise ValueError(f"Folio {folio_number} not found")

        if folio.investor_id != investor_id:
            raise ValueError("Folio does not belong to investor")

        # Convert frequency to enum (lowercase)
        freq_lower = frequency.lower() if isinstance(frequency, str) else str(frequency).lower()
        try:
            freq_enum = SIPFrequency[freq_lower]  # SWP uses same frequency enum
        except KeyError:
            raise ValueError(f"Invalid frequency: {frequency}")

        # Generate SWP registration ID
        result = self.db.query(func.max(SWPRegistration.id)).scalar()
        next_id = (result or 0) + 1
        registration_id = f"SWP{next_id:03d}"

        # Calculate next installment date
        next_installment_date = start_date

        # Create SWP registration
        swp_reg = SWPRegistration(
            investor_id=investor_id,
            folio_number=folio_number,
            scheme_id=folio.scheme_id,
            bank_account_id=bank_account_id,
            registration_id=registration_id,
            amount=amount,
            frequency=freq_enum,
            start_date=start_date,
            end_date=end_date,
            number_of_installments=installments,
            status=SIPStatus.active,
            next_installment_date=next_installment_date
        )
        self.db.add(swp_reg)
        self.db.flush()

        # Process first installment if start_date is today or in the past
        if start_date <= date.today():
            try:
                self.process_swp_installment(registration_id)
            except Exception as e:
                logger.warning(f"Failed to process first SWP installment: {e}")

        return swp_reg

    def setup_stp(
        self,
        investor_id: str,
        source_folio_number: str,
        target_scheme_id: str,
        amount: Decimal,
        frequency: str,
        start_date: date,
        end_date: Optional[date] = None,
        installments: Optional[int] = None
    ) -> STPRegistration:
        """Setup STP registration"""
        source_folio = self.db.query(Folio).filter(Folio.folio_number == source_folio_number).first()
        if not source_folio:
            raise ValueError(f"Source folio {source_folio_number} not found")

        if source_folio.investor_id != investor_id:
            raise ValueError("Source folio does not belong to investor")

        # Handle both S001 and SCH001 format for target scheme
        actual_target_scheme_id = None
        target_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == target_scheme_id).first()
        
        if not target_scheme:
            alt_scheme_id = "SCH" + target_scheme_id[1:] if target_scheme_id.startswith("S") and len(target_scheme_id) == 4 else target_scheme_id.replace("SCH", "S")
            target_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == alt_scheme_id).first()
            if target_scheme:
                actual_target_scheme_id = alt_scheme_id
        else:
            actual_target_scheme_id = target_scheme_id
        
        if not target_scheme:
            raise ValueError(f"Target scheme {target_scheme_id} not found")

        # Get or create target folio
        target_folio = self.get_or_create_folio(investor_id, actual_target_scheme_id)

        # Convert frequency to enum (lowercase)
        freq_lower = frequency.lower() if isinstance(frequency, str) else str(frequency).lower()
        try:
            freq_enum = SIPFrequency[freq_lower]  # STP uses same frequency enum
        except KeyError:
            raise ValueError(f"Invalid frequency: {frequency}")

        # Generate STP registration ID
        result = self.db.query(func.max(STPRegistration.id)).scalar()
        next_id = (result or 0) + 1
        registration_id = f"STP{next_id:03d}"

        # Calculate next installment date
        next_installment_date = start_date

        # Create STP registration
        stp_reg = STPRegistration(
            investor_id=investor_id,
            source_folio_number=source_folio_number,
            target_folio_number=target_folio.folio_number,
            source_scheme_id=source_folio.scheme_id,
            target_scheme_id=actual_target_scheme_id,
            registration_id=registration_id,
            amount=amount,
            frequency=freq_enum,
            start_date=start_date,
            end_date=end_date,
            number_of_installments=installments,
            status=SIPStatus.active,
            next_installment_date=next_installment_date
        )
        self.db.add(stp_reg)
        self.db.flush()

        # Process first installment if start_date is today or in the past
        if start_date <= date.today():
            try:
                self.process_stp_installment(registration_id)
            except Exception as e:
                logger.warning(f"Failed to process first STP installment: {e}")

        return stp_reg

    def process_switch(
        self,
        investor_id: str,
        source_folio_number: str,
        target_scheme_id: str,
        all_units: Optional[bool] = None,
        units: Optional[Decimal] = None,
        amount: Optional[Decimal] = None
    ) -> Dict[str, Transaction]:
        """Process switch transaction (redemption + purchase)"""
        source_folio = self.db.query(Folio).filter(Folio.folio_number == source_folio_number).first()
        if not source_folio:
            raise ValueError(f"Source folio {source_folio_number} not found")

        if source_folio.investor_id != investor_id:
            raise ValueError("Source folio does not belong to investor")

        # Handle both S001 and SCH001 format for target scheme
        actual_target_scheme_id = None
        target_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == target_scheme_id).first()
        
        if not target_scheme:
            alt_scheme_id = "SCH" + target_scheme_id[1:] if target_scheme_id.startswith("S") and len(target_scheme_id) == 4 else target_scheme_id.replace("SCH", "S")
            target_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == alt_scheme_id).first()
            if target_scheme:
                actual_target_scheme_id = alt_scheme_id
        else:
            actual_target_scheme_id = target_scheme_id
        
        if not target_scheme:
            raise ValueError(f"Target scheme {target_scheme_id} not found")

        # Determine units to switch
        if all_units:
            switch_units = source_folio.total_units
        elif units:
            switch_units = units
            if switch_units > source_folio.total_units:
                raise ValueError("Insufficient units for switch")
        elif amount:
            source_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == source_folio.scheme_id).first()
            if not source_scheme:
                raise ValueError(f"Source scheme {source_folio.scheme_id} not found")
            nav = source_scheme.current_nav
            switch_units = amount / nav
            if switch_units > source_folio.total_units:
                raise ValueError("Insufficient units for switch")
        else:
            raise ValueError("Must specify units, amount, or all_units")

        # Process redemption
        redemption_txn = self.process_redemption(
            folio_number=source_folio_number,
            units=switch_units
        )

        # Calculate purchase amount from redemption
        source_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == source_folio.scheme_id).first()
        if not source_scheme:
            raise ValueError(f"Source scheme {source_folio.scheme_id} not found")
        source_nav = source_scheme.current_nav
        switch_amount = switch_units * source_nav

        # Process purchase in target scheme
        purchase_txn = self.process_fresh_purchase(
            investor_id=investor_id,
            scheme_id=actual_target_scheme_id,
            amount=switch_amount,
            plan="Growth",  # Default plan
            payment_mode="net_banking"
        )

        # Link transactions
        purchase_txn.linked_transaction_id = redemption_txn.transaction_id
        redemption_txn.linked_transaction_id = purchase_txn.transaction_id
        redemption_txn.transaction_type = TransactionType.switch_redemption
        purchase_txn.transaction_type = TransactionType.switch_purchase

        self.db.flush()

        return {
            "redemption_transaction": redemption_txn,
            "purchase_transaction": purchase_txn
        }

    def get_portfolio_summary(self, investor_id: str) -> Dict[str, Any]:
        """Get portfolio summary for investor"""
        folios = self.db.query(Folio).filter(
            Folio.investor_id == investor_id,
            Folio.status == FolioStatus.active
        ).all()

        total_investment = Decimal('0.00')
        current_value = Decimal('0.00')
        portfolio_list = []

        for folio in folios:
            scheme = self.db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            if scheme:
                nav = scheme.current_nav
                value = folio.total_units * nav

                portfolio_list.append({
                    "folio_number": folio.folio_number,
                    "scheme_id": folio.scheme_id,
                    "scheme_name": scheme.scheme_name,
                    "total_units": float(folio.total_units),
                    "current_nav": float(nav),
                    "total_investment": float(folio.total_investment),
                    "total_value": float(value)
                })
                total_investment += folio.total_investment
                current_value += value

        return {
            "portfolio": portfolio_list,
            "summary": {
                "total_investment": float(total_investment),
                "current_value": float(current_value),
                "gain_loss": float(current_value - total_investment),
                "folio_count": len(portfolio_list)
            }
        }

    def get_transaction_history(self, investor_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get transaction history for investor with scheme details"""
        # Optimize with eager loading
        from sqlalchemy.orm import joinedload
        
        transactions = self.db.query(Transaction).options(
            joinedload(Transaction.scheme)
        ).filter(
            Transaction.investor_id == investor_id
        ).order_by(Transaction.transaction_date.desc()).limit(limit).all()

        transaction_list = []
        for txn in transactions:
            transaction_list.append({
                "transaction_id": txn.transaction_id,
                "transaction_type": txn.transaction_type.value if hasattr(txn.transaction_type, 'value') else str(txn.transaction_type),
                "scheme_id": txn.scheme_id,
                "scheme_name": txn.scheme.scheme_name if txn.scheme else None,
                "folio_number": txn.folio_number,
                "amount": float(txn.amount),
                "units": float(txn.units) if txn.units else 0.0,
                "nav_per_unit": float(txn.nav_per_unit),
                "transaction_date": txn.transaction_date.isoformat() if txn.transaction_date else None,
                "status": txn.status.value if hasattr(txn.status, 'value') else str(txn.status),
                "payment_mode": txn.payment_mode.value if txn.payment_mode and hasattr(txn.payment_mode, 'value') else str(txn.payment_mode) if txn.payment_mode else None
            })

        return transaction_list

    def process_sip_installment(self, registration_id: str) -> Transaction:
        """Process a single SIP installment"""
        sip_reg = self.db.query(SIPRegistration).filter(
            SIPRegistration.registration_id == registration_id
        ).first()

        if not sip_reg:
            raise ValueError(f"SIP registration {registration_id} not found")

        if sip_reg.status != SIPStatus.active:
            raise ValueError(f"SIP registration {registration_id} is not active")

        # Check Mandate Status
        mandate_service = MandateService(self.db)
        if not mandate_service.is_mandate_ready(sip_reg.bank_account_id, sip_reg.amount):
            logger.error(f"Mandate for SIP {registration_id} is not ready or active")
            # In a production system, we might mark the installment as failed
            raise ValueError(f"Bank mandate for SIP {registration_id} is not active or limit exceeded")

        # Get folio and scheme
        folio = self.db.query(Folio).filter(Folio.folio_number == sip_reg.folio_number).first()
        if not folio:
            raise ValueError(f"Folio {sip_reg.folio_number} not found")

        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == sip_reg.scheme_id).first()
        if not scheme:
            raise ValueError(f"Scheme {sip_reg.scheme_id} not found")

        nav = scheme.current_nav
        units = sip_reg.amount / nav

        # Generate transaction ID
        transaction_id = self.generate_transaction_id()

        # Create transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            investor_id=sip_reg.investor_id,
            folio_number=sip_reg.folio_number,
            scheme_id=sip_reg.scheme_id,
            amc_id=folio.amc_id,
            transaction_type=TransactionType.sip,
            transaction_date=date.today(),
            amount=sip_reg.amount,
            nav_per_unit=nav,
            units=units,
            status=TransactionStatus.completed,
            payment_mode=PaymentMode.debit_mandate,
            processing_date=date.today(),
            completion_date=date.today()
        )
        self.db.add(transaction)
        self.db.flush()

        # Update folio
        folio.current_nav = nav
        folio.total_units += units
        folio.total_investment += sip_reg.amount
        folio.total_value = folio.total_units * folio.current_nav
        folio.average_cost_per_unit = folio.total_investment / folio.total_units if folio.total_units > 0 else Decimal('0')
        folio.last_transaction_date = date.today()
        folio.transaction_count += 1

        # Update SIP registration
        sip_reg.total_installments_completed += 1
        sip_reg.total_amount_invested += sip_reg.amount
        sip_reg.last_processed_date = date.today()
        sip_reg.last_transaction_id = transaction_id

        # Calculate next installment date
        if sip_reg.frequency == SIPFrequency.monthly:
            if relativedelta:
                sip_reg.next_installment_date = sip_reg.next_installment_date + relativedelta(months=1)
            else:
                # Simple approximation: add 30 days
                sip_reg.next_installment_date = sip_reg.next_installment_date + timedelta(days=30)
        elif sip_reg.frequency == SIPFrequency.quarterly:
            if relativedelta:
                sip_reg.next_installment_date = sip_reg.next_installment_date + relativedelta(months=3)
            else:
                # Simple approximation: add 90 days
                sip_reg.next_installment_date = sip_reg.next_installment_date + timedelta(days=90)
        elif sip_reg.frequency == SIPFrequency.weekly:
            sip_reg.next_installment_date = sip_reg.next_installment_date + timedelta(weeks=1)
        elif sip_reg.frequency == SIPFrequency.daily:
            sip_reg.next_installment_date = sip_reg.next_installment_date + timedelta(days=1)

        # Check if SIP should be completed
        if sip_reg.number_of_installments and sip_reg.total_installments_completed >= sip_reg.number_of_installments:
            sip_reg.status = SIPStatus.completed
        if sip_reg.end_date and sip_reg.next_installment_date > sip_reg.end_date:
            sip_reg.status = SIPStatus.completed

        self.db.flush()
        return transaction

    def process_swp_installment(self, registration_id: str) -> Transaction:
        """Process a single SWP installment"""
        swp_reg = self.db.query(SWPRegistration).filter(
            SWPRegistration.registration_id == registration_id
        ).first()

        if not swp_reg:
            raise ValueError(f"SWP registration {registration_id} not found")

        if swp_reg.status != SIPStatus.active:
            raise ValueError(f"SWP registration {registration_id} is not active")

        # Get folio and scheme to update current_nav
        folio = self.db.query(Folio).filter(Folio.folio_number == swp_reg.folio_number).first()
        if not folio:
            raise ValueError(f"Folio {swp_reg.folio_number} not found")

        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == swp_reg.scheme_id).first()
        if not scheme:
            raise ValueError(f"Scheme {swp_reg.scheme_id} not found")

        # Process redemption
        transaction = self.process_redemption(
            folio_number=swp_reg.folio_number,
            amount=swp_reg.amount
        )

        # Update transaction type and ensure current_nav is updated
        transaction.transaction_type = TransactionType.swp
        folio.current_nav = scheme.current_nav
        folio.total_value = folio.total_units * folio.current_nav
        self.db.flush()

        # Update SWP registration
        swp_reg.total_installments_completed += 1
        swp_reg.total_amount_withdrawn += swp_reg.amount
        swp_reg.last_processed_date = date.today()
        swp_reg.last_transaction_id = transaction.transaction_id

        # Calculate next installment date (same logic as SIP)
        if swp_reg.frequency == SIPFrequency.monthly:
            if relativedelta:
                swp_reg.next_installment_date = swp_reg.next_installment_date + relativedelta(months=1)
            else:
                swp_reg.next_installment_date = swp_reg.next_installment_date + timedelta(days=30)
        elif swp_reg.frequency == SIPFrequency.quarterly:
            if relativedelta:
                swp_reg.next_installment_date = swp_reg.next_installment_date + relativedelta(months=3)
            else:
                swp_reg.next_installment_date = swp_reg.next_installment_date + timedelta(days=90)
        elif swp_reg.frequency == SIPFrequency.weekly:
            swp_reg.next_installment_date = swp_reg.next_installment_date + timedelta(weeks=1)
        elif swp_reg.frequency == SIPFrequency.daily:
            swp_reg.next_installment_date = swp_reg.next_installment_date + timedelta(days=1)

        # Check if SWP should be completed
        if swp_reg.number_of_installments and swp_reg.total_installments_completed >= swp_reg.number_of_installments:
            swp_reg.status = SIPStatus.completed
        if swp_reg.end_date and swp_reg.next_installment_date > swp_reg.end_date:
            swp_reg.status = SIPStatus.completed

        self.db.flush()
        return transaction

    def process_stp_installment(self, registration_id: str) -> Dict[str, Transaction]:
        """Process a single STP installment"""
        stp_reg = self.db.query(STPRegistration).filter(
            STPRegistration.registration_id == registration_id
        ).first()

        if not stp_reg:
            raise ValueError(f"STP registration {registration_id} not found")

        if stp_reg.status != SIPStatus.active:
            raise ValueError(f"STP registration {registration_id} is not active")

        # Get source folio and scheme
        source_folio = self.db.query(Folio).filter(Folio.folio_number == stp_reg.source_folio_number).first()
        if not source_folio:
            raise ValueError(f"Source folio {stp_reg.source_folio_number} not found")

        source_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == stp_reg.source_scheme_id).first()
        if not source_scheme:
            raise ValueError(f"Source scheme {stp_reg.source_scheme_id} not found")

        # Process redemption from source
        redemption_txn = self.process_redemption(
            folio_number=stp_reg.source_folio_number,
            amount=stp_reg.amount
        )
        redemption_txn.transaction_type = TransactionType.stp_redemption
        
        # Ensure source folio current_nav is updated
        source_folio.current_nav = source_scheme.current_nav
        
        # Calculate purchase amount
        source_nav = source_scheme.current_nav
        purchase_amount = stp_reg.amount  # STP amount is fixed in INR
        
        # Note: If redemption was by units, we would convert units * nav
        # But STP is usually by Amount, so we redeem 'amount' worth of units
        # and buy 'amount' worth of units (minus exit load if any)
        
        # Process purchase in target scheme
        purchase_txn = self.process_fresh_purchase(
            investor_id=start_date if isinstance(start_date, str) else stp_reg.investor_id, # Fix: use correct investor_id
            scheme_id=stp_reg.target_scheme_id,
            amount=purchase_amount,
            plan="Growth", # Default
            payment_mode="net_banking"
        )
        purchase_txn.transaction_type = TransactionType.stp_purchase
        
        # Link transactions
        purchase_txn.linked_transaction_id = redemption_txn.transaction_id
        redemption_txn.linked_transaction_id = purchase_txn.transaction_id
        
        # Update STP registration
        stp_reg.total_installments_completed += 1
        stp_reg.total_amount_transferred += stp_reg.amount
        stp_reg.last_processed_date = date.today()
        stp_reg.last_transaction_id = purchase_txn.transaction_id
        
        # Calculate next installment date
        if stp_reg.frequency == SIPFrequency.monthly:
            if relativedelta:
                stp_reg.next_installment_date = stp_reg.next_installment_date + relativedelta(months=1)
            else:
                stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=30)
        elif stp_reg.frequency == SIPFrequency.quarterly:
            if relativedelta:
                stp_reg.next_installment_date = stp_reg.next_installment_date + relativedelta(months=3)
            else:
                stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=90)
        elif stp_reg.frequency == SIPFrequency.weekly:
            stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(weeks=1)
        elif stp_reg.frequency == SIPFrequency.daily:
            stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=1)
            
        # Check completion
        if stp_reg.number_of_installments and stp_reg.total_installments_completed >= stp_reg.number_of_installments:
            stp_reg.status = SIPStatus.completed
        if stp_reg.end_date and stp_reg.next_installment_date > stp_reg.end_date:
            stp_reg.status = SIPStatus.completed
            
        self.db.flush()
        
        return {
            "redemption_transaction": redemption_txn,
            "purchase_transaction": purchase_txn
        }

    def process_unclaimed_claim(self, unclaimed_id: str, investor_id: str) -> Transaction:
        """Process claim for unclaimed amount"""
        unclaimed = self.db.query(UnclaimedAmount).filter(
            UnclaimedAmount.unclaimed_id == unclaimed_id
        ).first()
        
        if not unclaimed:
            raise ValueError(f"Unclaimed amount {unclaimed_id} not found")
            
        if unclaimed.investor_id != investor_id:
            raise ValueError("Unclaimed amount does not belong to investor")
            
        if unclaimed.claimed:
            raise ValueError(f"Unclaimed amount is already claimed")
            
        # Calculate total payout
        total_payout = unclaimed.total_amount
        
        # Generate transaction ID
        transaction_id = self.generate_transaction_id()
        
        # Create payout transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            investor_id=investor_id,
            folio_number=unclaimed.folio_number,
            scheme_id=unclaimed.scheme_id,
            amc_id="A001", # Placeholder, should fetch from scheme
            transaction_type=TransactionType.unclaimed_payout,
            transaction_date=date.today(),
            amount=total_payout,
            nav_per_unit=Decimal('0.00'), # Not applicable for payout
            units=Decimal('0.00'),
            status=TransactionStatus.completed,
            payment_mode=PaymentMode.neft, # Default payout mode
            processing_date=date.today(),
            completion_date=date.today(),
            remarks=f"Claim settlement for {unclaimed_id}"
        )
        
        # Fetch scheme to get AMC ID (correction)
        scheme = self.db.query(Scheme).filter(Scheme.scheme_id == unclaimed.scheme_id).first()
        if scheme:
            transaction.amc_id = scheme.amc_id
            
        self.db.add(transaction)
        
        # Update unclaimed status
        unclaimed.claimed = True
        unclaimed.claimed_date = date.today()
        unclaimed.claim_reference = f"CLM{transaction_id}"
        
        self.db.flush()
        return transaction
        source_folio.total_value = source_folio.total_units * source_folio.current_nav
        
        self.db.flush()

        # Calculate units redeemed and use as purchase amount
        source_nav = source_scheme.current_nav
        units_redeemed = abs(float(redemption_txn.units))
        redemption_amount = units_redeemed * float(source_nav)

        # Process purchase in target
        target_folio = self.db.query(Folio).filter(Folio.folio_number == stp_reg.target_folio_number).first()
        if not target_folio:
            raise ValueError(f"Target folio {stp_reg.target_folio_number} not found")

        target_scheme = self.db.query(Scheme).filter(Scheme.scheme_id == stp_reg.target_scheme_id).first()
        if not target_scheme:
            raise ValueError(f"Target scheme {stp_reg.target_scheme_id} not found")

        target_nav = target_scheme.current_nav
        purchase_units = Decimal(str(redemption_amount)) / target_nav

        purchase_txn_id = self.generate_transaction_id()
        purchase_txn = Transaction(
            transaction_id=purchase_txn_id,
            investor_id=stp_reg.investor_id,
            folio_number=stp_reg.target_folio_number,
            scheme_id=stp_reg.target_scheme_id,
            amc_id=target_folio.amc_id,
            transaction_type=TransactionType.stp_purchase,
            transaction_date=date.today(),
            amount=Decimal(str(redemption_amount)),
            nav_per_unit=target_nav,
            units=purchase_units,
            status=TransactionStatus.completed,
            payment_mode=PaymentMode.debit_mandate,
            linked_transaction_id=redemption_txn.transaction_id,
            processing_date=date.today(),
            completion_date=date.today()
        )
        self.db.add(purchase_txn)
        redemption_txn.linked_transaction_id = purchase_txn_id
        self.db.flush()

        # Update target folio
        target_folio.current_nav = target_nav
        target_folio.total_units += purchase_units
        target_folio.total_investment += Decimal(str(redemption_amount))
        target_folio.total_value = target_folio.total_units * target_folio.current_nav
        target_folio.average_cost_per_unit = target_folio.total_investment / target_folio.total_units if target_folio.total_units > 0 else Decimal('0')
        target_folio.last_transaction_date = date.today()
        target_folio.transaction_count += 1

        # Update STP registration
        stp_reg.total_installments_completed += 1
        stp_reg.total_amount_transferred += Decimal(str(redemption_amount))
        stp_reg.last_processed_date = date.today()
        stp_reg.last_transaction_id = redemption_txn.transaction_id

        # Calculate next installment date
        if stp_reg.frequency == SIPFrequency.monthly:
            if relativedelta:
                stp_reg.next_installment_date = stp_reg.next_installment_date + relativedelta(months=1)
            else:
                stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=30)
        elif stp_reg.frequency == SIPFrequency.quarterly:
            if relativedelta:
                stp_reg.next_installment_date = stp_reg.next_installment_date + relativedelta(months=3)
            else:
                stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=90)
        elif stp_reg.frequency == SIPFrequency.weekly:
            stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(weeks=1)
        elif stp_reg.frequency == SIPFrequency.daily:
            stp_reg.next_installment_date = stp_reg.next_installment_date + timedelta(days=1)

        # Check if STP should be completed
        if stp_reg.number_of_installments and stp_reg.total_installments_completed >= stp_reg.number_of_installments:
            stp_reg.status = SIPStatus.completed
        if stp_reg.end_date and stp_reg.next_installment_date > stp_reg.end_date:
            stp_reg.status = SIPStatus.completed

        self.db.flush()

        return {
            "redemption_transaction": redemption_txn,
            "purchase_transaction": purchase_txn
        }
