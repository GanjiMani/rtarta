from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.models.transaction import TransactionType, TransactionStatus, PaymentMode


class TransactionBase(BaseModel):
    scheme_id: str = Field(..., pattern=r'^(S|SCH)\d{3}$')  # S001 or SCH001 - both accepted
    amount: Decimal = Field(..., gt=0)
    
    @validator('scheme_id')
    def normalize_scheme_id(cls, v):
        """Normalize scheme_id from SCH001 to S001 format"""
        if v and v.startswith('SCH'):
            return 'S' + v[3:]
        return v


class PurchaseRequest(TransactionBase):
    plan: str = Field(..., pattern=r'^(Growth|IDCW Payout|IDCW Reinvestment)$')
    payment_mode: PaymentMode
    bank_account_last4: str = Field(..., pattern=r'^\d{4}$')  # Last 4 digits of account

    @validator('amount')
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('Minimum purchase amount is ₹100')
        if v > 1000000:  # 10 lakhs
            raise ValueError('Maximum purchase amount is ₹10,00,000')
        return v


class RedemptionRequest(BaseModel):
    folio_number: str = Field(..., pattern=r'^F\d{3}$')
    units: Optional[Decimal] = Field(None, gt=0)
    amount: Optional[Decimal] = Field(None, gt=0)
    all_units: bool = False

    @validator('units')
    def validate_units(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Units must be greater than 0')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v
    
    @model_validator(mode='after')
    def validate_redemption_params(self):
        """Ensure only one of units, amount, or all_units is provided"""
        units = self.units
        amount = self.amount
        all_units = self.all_units
        
        provided = []
        if units is not None:
            provided.append('units')
        if amount is not None:
            provided.append('amount')
        if all_units is True:
            provided.append('all_units')
        
        if len(provided) == 0:
            raise ValueError('Must provide one of: units, amount, or all_units')
        if len(provided) > 1:
            raise ValueError(f'Provide only one of: units, amount, or all_units (provided: {", ".join(provided)})')
        
        return self


class SIPSetupRequest(BaseModel):
    scheme_id: str = Field(..., pattern=r'^(S|SCH)\d{3}$')  # S001 or SCH001 - both accepted
    amount: Decimal = Field(..., gt=0)
    frequency: str = Field(..., pattern=r'^(Monthly|Quarterly|Weekly|Daily)$')
    start_date: date
    end_date: Optional[date] = None
    installments: Optional[int] = Field(None, gt=0, le=240)  # Max 20 years monthly
    bank_account_id: int

    @validator('scheme_id')
    def normalize_scheme_id(cls, v):
        """Normalize scheme_id from SCH001 to S001 format"""
        if v and v.startswith('SCH'):
            return 'S' + v[3:]
        return v

    @validator('amount')
    def validate_sip_amount(cls, v):
        if v < 100:
            raise ValueError('Minimum SIP amount is ₹100')
        if v > 50000:
            raise ValueError('Maximum SIP amount is ₹50,000')
        return v

    @validator('start_date')
    def validate_start_date(cls, v):
        if v <= date.today():
            raise ValueError('Start date must be in the future')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class SWPSetupRequest(BaseModel):
    folio_number: str = Field(..., pattern=r'^F\d{3}$')
    amount: Decimal = Field(..., gt=0)
    frequency: str = Field(..., pattern=r'^(Monthly|Quarterly|Weekly|Daily)$')
    start_date: date
    end_date: Optional[date] = None
    installments: Optional[int] = Field(None, gt=0, le=240)
    bank_account_id: int

    @validator('amount')
    def validate_swp_amount(cls, v):
        if v < 500:
            raise ValueError('Minimum SWP amount is ₹500')
        if v > 100000:
            raise ValueError('Maximum SWP amount is ₹1,00,000')
        return v

    @validator('start_date')
    def validate_start_date(cls, v):
        if v <= date.today():
            raise ValueError('Start date must be in the future')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class STPSetupRequest(BaseModel):
    source_folio_number: str = Field(..., pattern=r'^F\d{3}$')
    target_scheme_id: str = Field(..., pattern=r'^(S|SCH)\d{3}$')  # S001 or SCH001 - both accepted
    amount: Decimal = Field(..., gt=0)
    frequency: str = Field(..., pattern=r'^(Monthly|Quarterly|Weekly|Daily)$')
    start_date: date
    end_date: Optional[date] = None
    installments: Optional[int] = Field(None, gt=0, le=240)

    @validator('target_scheme_id')
    def normalize_scheme_id(cls, v):
        """Normalize scheme_id from SCH001 to S001 format"""
        if v and v.startswith('SCH'):
            return 'S' + v[3:]
        return v

    @validator('amount')
    def validate_stp_amount(cls, v):
        if v < 500:
            raise ValueError('Minimum STP amount is ₹500')
        if v > 100000:
            raise ValueError('Maximum STP amount is ₹1,00,000')
        return v

    @validator('start_date')
    def validate_start_date(cls, v):
        if v <= date.today():
            raise ValueError('Start date must be in the future')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class SwitchRequest(BaseModel):
    source_folio_number: str = Field(..., pattern=r'^F\d{3}$')
    target_scheme_id: str = Field(..., pattern=r'^(S|SCH)\d{3}$')  # S001 or SCH001 - both accepted
    all_units: bool = True
    units: Optional[Decimal] = Field(None, gt=0)
    amount: Optional[Decimal] = Field(None, gt=0)

    @validator('target_scheme_id')
    def normalize_scheme_id(cls, v):
        """Normalize scheme_id from SCH001 to S001 format"""
        if v and v.startswith('SCH'):
            return 'S' + v[3:]
        return v

    @validator('units')
    def validate_units(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Units must be greater than 0')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

    @model_validator(mode='after')
    def validate_switch_request(self):
        """Ensure only one of units, amount, or all_units is provided"""
        provided = sum([
            self.all_units,
            self.units is not None,
            self.amount is not None
        ])
        if provided != 1:
            raise ValueError('Must provide exactly one of: all_units=True, units, or amount')
        return self


class TransactionResponse(BaseModel):
    transaction_id: str
    transaction_type: TransactionType
    amount: Decimal
    units: Optional[Decimal]
    nav_per_unit: Decimal
    status: TransactionStatus
    transaction_date: date
    scheme_id: str
    folio_number: Optional[str]
    exit_load_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class FolioSummary(BaseModel):
    folio_number: str
    scheme_id: str
    scheme_name: str
    total_units: Decimal
    current_nav: Decimal
    total_value: Decimal
    total_investment: Decimal
    gain_loss: Decimal
    gain_loss_percentage: Decimal
    last_transaction_date: Optional[date]

    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    total_folios: int
    total_investment: Decimal
    current_value: Decimal
    total_gain_loss: Decimal
    folios: List[FolioSummary]

    class Config:
        from_attributes = True


class TransactionHistoryItem(BaseModel):
    transaction_id: str
    transaction_type: str
    transaction_date: date
    amount: Decimal
    units: Optional[Decimal]
    nav_per_unit: Decimal
    status: str
    scheme_id: str
    scheme_name: str
    folio_number: Optional[str]

    class Config:
        from_attributes = True


class SIPRegistrationResponse(BaseModel):
    registration_id: str
    scheme_id: str
    amount: Decimal
    frequency: str
    status: str
    next_installment_date: date
    total_installments_completed: int

    class Config:
        from_attributes = True


class SWPRegistrationResponse(BaseModel):
    registration_id: str
    folio_number: str
    amount: Decimal
    frequency: str
    status: str
    next_installment_date: date
    total_installments_completed: int

    class Config:
        from_attributes = True


class STPRegistrationResponse(BaseModel):
    registration_id: str
    source_folio: str
    target_scheme: str
    amount: Decimal
    frequency: str
    status: str
    next_installment_date: date
    total_installments_completed: int

    class Config:
        from_attributes = True
