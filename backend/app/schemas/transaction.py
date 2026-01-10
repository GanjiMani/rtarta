from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.models.transaction import PaymentMode


class TransactionBase(BaseModel):
    """Base schema for transaction requests"""
    pass


class PurchaseRequest(TransactionBase):
    """Request schema for purchase transactions"""
    scheme_id: str = Field(..., min_length=1, description="Scheme ID (e.g., SCH001)")
    amount: Decimal = Field(..., gt=0, description="Purchase amount (minimum ₹100)")
    plan: str = Field(..., description="Plan type: Growth, IDCW Payout, or IDCW Reinvestment")
    payment_mode: PaymentMode = Field(..., description="Payment mode")
    bank_account_last4: Optional[str] = Field(None, description="Last 4 digits of bank account")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('Purchase amount must be at least ₹100')
        if v > 10000000:  # 1 crore
            raise ValueError('Purchase amount cannot exceed ₹1,00,00,000')
        return v

    @field_validator('plan')
    @classmethod
    def validate_plan(cls, v):
        valid_plans = ['Growth', 'IDCW Payout', 'IDCW Reinvestment']
        if v not in valid_plans:
            raise ValueError(f'Plan must be one of: {", ".join(valid_plans)}')
        return v


class RedemptionRequest(TransactionBase):
    """Request schema for redemption transactions"""
    folio_number: str = Field(..., min_length=1, description="Folio number")
    units: Optional[Decimal] = Field(None, gt=0, description="Units to redeem")
    amount: Optional[Decimal] = Field(None, gt=0, description="Amount to redeem")
    all_units: Optional[bool] = Field(None, description="Redeem all units")

    @model_validator(mode='after')
    def validate_redemption_type(self):
        """Ensure exactly one of units, amount, or all_units is provided"""
        count = sum([
            self.units is not None,
            self.amount is not None,
            self.all_units is True
        ])
        if count != 1:
            raise ValueError('Exactly one of units, amount, or all_units must be provided')
        return self


class SIPSetupRequest(TransactionBase):
    """Request schema for SIP setup"""
    scheme_id: str = Field(..., min_length=1, description="Scheme ID")
    amount: Decimal = Field(..., gt=0, description="SIP amount per installment")
    frequency: str = Field(..., pattern="^(Monthly|Quarterly|Weekly|Daily)$", description="SIP frequency")
    start_date: date = Field(..., description="SIP start date")
    bank_account_id: int = Field(..., gt=0, description="Bank account ID for mandate")
    end_date: Optional[date] = Field(None, description="SIP end date (optional)")
    installments: Optional[int] = Field(None, gt=0, description="Number of installments (optional)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('SIP amount must be at least ₹100')
        if v > 1000000:  # 10 lakhs
            raise ValueError('SIP amount cannot exceed ₹10,00,000')
        return v

    @model_validator(mode='after')
    def validate_dates(self):
        """Ensure end_date is after start_date if provided"""
        if self.end_date and self.end_date <= self.start_date:
            raise ValueError('End date must be after start date')
        return self


class SWPSetupRequest(TransactionBase):
    """Request schema for SWP setup"""
    folio_number: str = Field(..., min_length=1, description="Folio number")
    amount: Decimal = Field(..., gt=0, description="SWP withdrawal amount per installment")
    frequency: str = Field(..., pattern="^(Monthly|Quarterly|Weekly|Daily)$", description="SWP frequency")
    start_date: date = Field(..., description="SWP start date")
    bank_account_id: int = Field(..., gt=0, description="Bank account ID for withdrawal")
    end_date: Optional[date] = Field(None, description="SWP end date (optional)")
    installments: Optional[int] = Field(None, gt=0, description="Number of installments (optional)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('SWP amount must be at least ₹100')
        return v

    @model_validator(mode='after')
    def validate_dates(self):
        """Ensure end_date is after start_date if provided"""
        if self.end_date and self.end_date <= self.start_date:
            raise ValueError('End date must be after start date')
        return self


class STPSetupRequest(TransactionBase):
    """Request schema for STP setup"""
    source_folio_number: str = Field(..., min_length=1, description="Source folio number")
    target_scheme_id: str = Field(..., min_length=1, description="Target scheme ID")
    amount: Decimal = Field(..., gt=0, description="STP transfer amount per installment")
    frequency: str = Field(..., pattern="^(Monthly|Quarterly|Weekly|Daily)$", description="STP frequency")
    start_date: date = Field(..., description="STP start date")
    end_date: Optional[date] = Field(None, description="STP end date (optional)")
    installments: Optional[int] = Field(None, gt=0, description="Number of installments (optional)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('STP amount must be at least ₹100')
        return v

    @model_validator(mode='after')
    def validate_dates(self):
        """Ensure end_date is after start_date if provided"""
        if self.end_date and self.end_date <= self.start_date:
            raise ValueError('End date must be after start date')
        return self


class SwitchRequest(TransactionBase):
    """Request schema for switch transactions"""
    source_folio_number: str = Field(..., min_length=1, description="Source folio number")
    target_scheme_id: str = Field(..., min_length=1, description="Target scheme ID")
    all_units: Optional[bool] = Field(None, description="Switch all units")
    units: Optional[Decimal] = Field(None, gt=0, description="Units to switch")
    amount: Optional[Decimal] = Field(None, gt=0, description="Amount to switch")

    @model_validator(mode='after')
    def validate_switch_type(self):
        """Ensure exactly one of all_units, units, or amount is provided"""
        count = sum([
            self.all_units is True,
            self.units is not None,
            self.amount is not None
        ])
        if count != 1:
            raise ValueError('Exactly one of all_units, units, or amount must be provided')
        return self


class TransactionResponse(BaseModel):
    """Response schema for transaction data"""
    transaction_id: str
    investor_id: str
    folio_number: Optional[str] = None
    scheme_id: str
    amc_id: str
    transaction_type: str
    transaction_date: date
    amount: Decimal
    nav_per_unit: Decimal
    units: Optional[Decimal] = None
    status: str
    processing_date: Optional[date] = None
    completion_date: Optional[date] = None
    payment_mode: Optional[str] = None
    payment_reference: Optional[str] = None
    bank_account_used: Optional[str] = None
    stamp_duty: Optional[Decimal] = None
    transaction_charges: Optional[Decimal] = None
    exit_load_amount: Optional[Decimal] = None
    gst_amount: Optional[Decimal] = None
    linked_transaction_id: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionHistoryItem(BaseModel):
    """Schema for transaction history items"""
    transaction_id: str
    transaction_type: str
    transaction_date: Optional[str] = None  # ISO date string
    amount: float  # Accept float from service
    units: Optional[float] = None  # Accept float from service
    nav_per_unit: float  # Accept float from service
    status: str
    scheme_id: str
    scheme_name: str
    folio_number: Optional[str] = None


class PortfolioSummary(BaseModel):
    """Schema for portfolio summary"""
    total_investment: Decimal
    current_value: Decimal
    total_gain_loss: Decimal
    total_gain_loss_percentage: Decimal
    total_folios: int
    active_folios: int
    total_sips: int
    active_sips: int
    folios: List[dict] = []
