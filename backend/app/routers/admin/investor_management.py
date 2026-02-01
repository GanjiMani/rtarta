from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from app.db.session import get_db
from app.models.investor import Investor, KYCStatus
from app.models.folio import Folio
from app.models.transaction import Transaction
from app.models.user import User
from app.core.permissions import has_permission
from app.core.roles import AdminPermissions
from app.schemas.admin_investor import InvestorSchema, InvestorDetailSchema, InvestorUpdate, FolioSchema
from app.schemas.investor import BankAccountInDB, NomineeInDB
from app.models.mandate import BankAccount, Nominee

router = APIRouter(prefix="/admin/investors", tags=["admin-investors"])

@router.get("/", response_model=dict)
async def list_investors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    kyc_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_ALL))
):
    """
    List all investors with pagination and filtering.
    """
    query = db.query(Investor)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Investor.full_name.ilike(search_filter)) |
            (Investor.email.ilike(search_filter)) |
            (Investor.pan_number.ilike(search_filter)) |
            (Investor.investor_id.ilike(search_filter))
        )

    if kyc_status:
        try:
            status_enum = KYCStatus[kyc_status]
            query = query.filter(Investor.kyc_status == status_enum)
        except KeyError:
             pass 

    total = query.count()
    investors = query.order_by(desc(Investor.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # Calculate total investment per investor (simplified)
    # Ideally should be a subquery or separate aggregation for performance
    investor_list = []
    for inv in investors:
        total_inv = sum([f.total_investment for f in inv.folios]) if inv.folios else 0.0
        
        inv_data = InvestorSchema(
            investor_id=inv.investor_id,
            pan_number=inv.pan_number,
            full_name=inv.full_name,
            email=inv.email,
            mobile_number=inv.mobile_number,
            kyc_status=inv.kyc_status.value,
            date_of_birth=inv.date_of_birth,
            city=inv.city,
            state=inv.state,
            is_active=inv.is_active,
            total_investment=float(total_inv)
        )
        investor_list.append(inv_data)

    return {
        "data": investor_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@router.get("/{investor_id}", response_model=InvestorDetailSchema)
async def get_investor_details(
    investor_id: str = Path(..., title="The ID of the investor"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_FOLIO))
):
    """
    Get detailed profile of a specific investor.
    """
    investor = db.query(Investor).filter(Investor.investor_id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    folios_count = len(investor.folios)
    nominees_count = len(investor.nominees)
    
    return InvestorDetailSchema(
        **investor.__dict__,
        kyc_status=investor.kyc_status.value,
        occupation=investor.occupation.value if investor.occupation else None,
        income_slab=investor.income_slab.value if investor.income_slab else None,
        folios_count=folios_count,
        nominees_count=nominees_count
    )

@router.put("/{investor_id}")
async def update_investor_details(
    investor_data: InvestorUpdate,
    investor_id: str = Path(..., title="The ID of the investor"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.ADMIN_USERS)) # Restricted to higher usage
):
    """
    Update restricted details of an investor (Address, Contact info).
    Critical fields like PAN and Name are usually immutable or require special process.
    """
    investor = db.query(Investor).filter(Investor.investor_id == investor_id).first()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    update_data = investor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(investor, key, value)

    db.commit()
    db.refresh(investor)
    return {"message": "Investor details updated successfully", "investor_id": investor.investor_id}

@router.get("/{investor_id}/folios", response_model=List[FolioSchema])
async def get_investor_folios(
    investor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_FOLIO))
):
    """
    Get list of folios for a specific investor.
    """
    folios = db.query(Folio).filter(Folio.investor_id == investor_id).all()
    
    return [
        FolioSchema(
            folio_number=f.folio_number,
            scheme_name=f.scheme.scheme_name if f.scheme else "Unknown",
            amc_name=f.amc.amc_name if f.amc else "Unknown",
            total_units=float(f.total_units),
            current_nav=float(f.current_nav),
            total_value=float(f.total_value),
            status=f.status.value
        ) for f in folios
    ]

@router.get("/{investor_id}/transactions")
async def get_investor_transactions(
    investor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_TRANSACTIONS))
):
    """
    Get recent transactions for a specific investor.
    """
    transactions = db.query(Transaction).filter(
        Transaction.investor_id == investor_id
    ).order_by(desc(Transaction.transaction_date)).limit(50).all()
    
    return [
        {
            "id": t.transaction_id,
            "date": t.transaction_date,
            "type": t.transaction_type.value,
            "amount": float(t.amount),
            "status": t.status.value,
            "folio": t.folio_number
        } for t in transactions
    ]
@router.get("/{investor_id}/bank-accounts", response_model=List[BankAccountInDB])
async def get_investor_bank_accounts(
    investor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_FOLIO))
):
    """
    Get bank accounts for a specific investor.
    """
    accounts = db.query(BankAccount).filter(BankAccount.investor_id == investor_id).all()
    return accounts

@router.get("/{investor_id}/nominees", response_model=List[NomineeInDB])
async def get_investor_nominees(
    investor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.READ_FOLIO))
):
    """
    Get nominees for a specific investor.
    """
    nominees = db.query(Nominee).filter(Nominee.investor_id == investor_id).all()
    return nominees
