from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.services.transaction_service import TransactionService
from app.services.investor_service import InvestorService
from app.schemas.transaction import (
    PurchaseRequest, RedemptionRequest, SIPSetupRequest, SWPSetupRequest,
    STPSetupRequest, SwitchRequest, TransactionResponse, PortfolioSummary,
    TransactionHistoryItem
)
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.transaction import Transaction
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/schemes")
async def get_available_schemes(
    db: Session = Depends(get_db)
):
    """Get all available schemes open for investment"""
    try:
        from app.models.scheme import Scheme
        
        schemes = db.query(Scheme).filter(
            Scheme.is_active == True,
            Scheme.is_open_for_investment == True
        ).all()
        
        schemes_list = []
        for scheme in schemes:
            # Use scheme_id as-is from database (could be S001 or SCH001)
            scheme_id = scheme.scheme_id
            
            schemes_list.append({
                "scheme_id": scheme_id,
                "scheme_name": scheme.scheme_name,
                "scheme_type": scheme.scheme_type.value if hasattr(scheme.scheme_type, 'value') else str(scheme.scheme_type),
                "plan_type": scheme.plan_type.value if hasattr(scheme.plan_type, 'value') else str(scheme.plan_type),
                "option_type": scheme.option_type.value if hasattr(scheme.option_type, 'value') else str(scheme.option_type),
                "current_nav": float(scheme.current_nav) if scheme.current_nav else 0.0,
                "nav_date": scheme.nav_date.isoformat() if scheme.nav_date else None,
                "minimum_investment": float(scheme.minimum_investment) if scheme.minimum_investment else 100.0,
                "additional_investment": float(scheme.additional_investment) if scheme.additional_investment else 100.0,
                "amc_id": scheme.amc_id
            })
        
        return {
            "message": "Available schemes retrieved successfully",
            "data": schemes_list
        }
    
    except Exception as e:
        logger.error(f"Get schemes error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve schemes"
        )


@router.post("/purchase")
async def purchase_units(
    purchase_data: PurchaseRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Process fresh purchase transaction"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        logger.info(f"Processing purchase for investor {current_user.investor_id}, scheme {purchase_data.scheme_id}, amount {purchase_data.amount}")
        transaction_service = TransactionService(db)

        # Convert PaymentMode enum to string if needed
        payment_mode_value = purchase_data.payment_mode.value if hasattr(purchase_data.payment_mode, 'value') else str(purchase_data.payment_mode)
        
        transaction = transaction_service.process_fresh_purchase(
            investor_id=current_user.investor_id,
            scheme_id=purchase_data.scheme_id,
            amount=purchase_data.amount,
            plan=purchase_data.plan,
            payment_mode=payment_mode_value
        )

        logger.info(f"Purchase transaction created: {transaction.transaction_id}")

        # Convert to response
        transaction_response = TransactionResponse.model_validate(transaction)
        logger.info(f"Transaction response created successfully")

        return {
            "message": "Purchase transaction processed successfully",
            "data": {
                "transaction": transaction_response,
                "folio_number": transaction.folio_number
            }
        }

    except ValueError as e:
        logger.warning(f"Purchase validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Purchase error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Purchase failed: {str(e)}"
        )


@router.post("/redemption")
async def redeem_units(
    redemption_data: RedemptionRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Process redemption transaction"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Verify folio ownership BEFORE processing transaction
        from app.models.folio import Folio
        folio = db.query(Folio).filter(Folio.folio_number == redemption_data.folio_number).first()
        if not folio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Folio {redemption_data.folio_number} not found"
            )
        
        if folio.investor_id != current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this folio"
            )
        
        transaction_service = TransactionService(db)

        transaction = transaction_service.process_redemption(
            folio_number=redemption_data.folio_number,
            units=redemption_data.units,
            amount=redemption_data.amount,
            all_units=redemption_data.all_units
        )

        return {
            "message": "Redemption transaction processed successfully",
            "data": {
                "transaction": TransactionResponse.model_validate(transaction)
            }
        }

    except ValueError as e:
        logger.warning(f"Redemption validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Redemption error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Redemption failed: {str(e)}"
        )


@router.post("/sip")
async def setup_sip(
    sip_data: SIPSetupRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Setup Systematic Investment Plan"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )

        transaction_service = TransactionService(db)

        sip_registration = transaction_service.setup_sip(
            investor_id=current_user.investor_id,
            scheme_id=sip_data.scheme_id,
            amount=sip_data.amount,
            frequency=sip_data.frequency,
            start_date=sip_data.start_date,
            end_date=sip_data.end_date,
            installments=sip_data.installments,
            bank_account_id=sip_data.bank_account_id
        )

        return {
            "message": "SIP setup successful",
            "data": {
                "sip_registration": {
                    "registration_id": sip_registration.registration_id,
                    "investor_id": sip_registration.investor_id,
                    "folio_number": sip_registration.folio_number,
                    "scheme_id": sip_registration.scheme_id,
                    "amount": float(sip_registration.amount),
                    "frequency": sip_registration.frequency.value if hasattr(sip_registration.frequency, 'value') else str(sip_registration.frequency),
                    "start_date": sip_registration.start_date.isoformat() if sip_registration.start_date else None,
                    "end_date": sip_registration.end_date.isoformat() if sip_registration.end_date else None,
                    "number_of_installments": sip_registration.number_of_installments,
                    "status": sip_registration.status.value if hasattr(sip_registration.status, 'value') else str(sip_registration.status),
                    "next_installment_date": sip_registration.next_installment_date.isoformat() if sip_registration.next_installment_date else None,
                    "bank_account_id": sip_registration.bank_account_id
                }
            }
        }

    except ValueError as e:
        logger.warning(f"SIP setup validation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SIP setup error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SIP setup failed: {str(e)}"
        )


@router.post("/swp")
async def setup_swp(
    swp_data: SWPSetupRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Setup Systematic Withdrawal Plan"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )

        transaction_service = TransactionService(db)

        swp_registration = transaction_service.setup_swp(
            investor_id=current_user.investor_id,
            folio_number=swp_data.folio_number,
            amount=swp_data.amount,
            frequency=swp_data.frequency,
            start_date=swp_data.start_date,
            end_date=swp_data.end_date,
            installments=swp_data.installments,
            bank_account_id=swp_data.bank_account_id
        )

        return {
            "message": "SWP setup successful",
            "data": {
                "swp_registration": {
                    "registration_id": swp_registration.registration_id,
                    "investor_id": swp_registration.investor_id,
                    "folio_number": swp_registration.folio_number,
                    "scheme_id": swp_registration.scheme_id,
                    "amount": float(swp_registration.amount),
                    "frequency": swp_registration.frequency.value if hasattr(swp_registration.frequency, 'value') else str(swp_registration.frequency),
                    "start_date": swp_registration.start_date.isoformat() if swp_registration.start_date else None,
                    "end_date": swp_registration.end_date.isoformat() if swp_registration.end_date else None,
                    "number_of_installments": swp_registration.number_of_installments,
                    "status": swp_registration.status.value if hasattr(swp_registration.status, 'value') else str(swp_registration.status),
                    "next_installment_date": swp_registration.next_installment_date.isoformat() if swp_registration.next_installment_date else None,
                    "bank_account_id": swp_registration.bank_account_id
                }
            }
        }

    except ValueError as e:
        logger.warning(f"SWP setup validation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SWP setup error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SWP setup failed: {str(e)}"
        )


@router.post("/stp")
async def setup_stp(
    stp_data: STPSetupRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Setup Systematic Transfer Plan"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )

        transaction_service = TransactionService(db)

        stp_registration = transaction_service.setup_stp(
            investor_id=current_user.investor_id,
            source_folio_number=stp_data.source_folio_number,
            target_scheme_id=stp_data.target_scheme_id,
            amount=stp_data.amount,
            frequency=stp_data.frequency,
            start_date=stp_data.start_date,
            end_date=stp_data.end_date,
            installments=stp_data.installments
        )

        return {
            "message": "STP setup successful",
            "data": {
                "stp_registration": {
                    "registration_id": stp_registration.registration_id,
                    "investor_id": stp_registration.investor_id,
                    "source_folio_number": stp_registration.source_folio_number,
                    "target_folio_number": stp_registration.target_folio_number,
                    "source_scheme_id": stp_registration.source_scheme_id,
                    "target_scheme_id": stp_registration.target_scheme_id,
                    "amount": float(stp_registration.amount),
                    "frequency": stp_registration.frequency.value if hasattr(stp_registration.frequency, 'value') else str(stp_registration.frequency),
                    "start_date": stp_registration.start_date.isoformat() if stp_registration.start_date else None,
                    "end_date": stp_registration.end_date.isoformat() if stp_registration.end_date else None,
                    "number_of_installments": stp_registration.number_of_installments,
                    "status": stp_registration.status.value if hasattr(stp_registration.status, 'value') else str(stp_registration.status),
                    "next_installment_date": stp_registration.next_installment_date.isoformat() if stp_registration.next_installment_date else None
                }
            }
        }

    except ValueError as e:
        logger.warning(f"STP setup validation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STP setup error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"STP setup failed: {str(e)}"
        )


@router.post("/switch")
async def switch_funds(
    switch_data: SwitchRequest,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Process switch transaction"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )

        transaction_service = TransactionService(db)

        switch_result = transaction_service.process_switch(
            investor_id=current_user.investor_id,
            source_folio_number=switch_data.source_folio_number,
            target_scheme_id=switch_data.target_scheme_id,
            all_units=switch_data.all_units,
            units=switch_data.units,
            amount=switch_data.amount
        )

        redemption_txn = switch_result["redemption_transaction"]
        purchase_txn = switch_result["purchase_transaction"]

        return {
            "message": "Switch transaction processed successfully",
            "data": {
                "redemption_transaction": TransactionResponse.model_validate(redemption_txn),
                "purchase_transaction": TransactionResponse.model_validate(purchase_txn),
                "redemption_txn_id": redemption_txn.transaction_id,
                "purchase_txn_id": purchase_txn.transaction_id
            }
        }

    except ValueError as e:
        logger.warning(f"Switch validation error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Switch error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Switch failed: {str(e)}"
        )


@router.get("/portfolio")
async def get_portfolio_summary(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get investor portfolio summary"""
    try:
        transaction_service = TransactionService(db)
        portfolio = transaction_service.get_portfolio_summary(current_user.investor_id)

        return {
            "message": "Portfolio summary retrieved successfully",
            "data": PortfolioSummary(**portfolio)
        }

    except Exception as e:
        logger.error(f"Get portfolio error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve portfolio summary"
        )


@router.get("/history")
async def get_transaction_history(
    limit: int = 50,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get transaction history"""
    try:
        transaction_service = TransactionService(db)
        transactions = transaction_service.get_transaction_history(current_user.investor_id, limit)

        # Get scheme names for transactions
        from app.models.scheme import Scheme
        transaction_items = []
        for txn in transactions:
            scheme = db.query(Scheme).filter(Scheme.scheme_id == txn.scheme_id).first()
            scheme_name = scheme.scheme_name if scheme else ""
            
            transaction_items.append(TransactionHistoryItem(
                transaction_id=txn.transaction_id,
                transaction_type=txn.transaction_type.value,
                transaction_date=txn.transaction_date,
                amount=txn.amount,
                units=txn.units,
                nav_per_unit=txn.nav_per_unit,
                status=txn.status.value,
                scheme_id=txn.scheme_id,
                scheme_name=scheme_name,
                folio_number=txn.folio_number
            ))

        return {
            "message": "Transaction history retrieved successfully",
            "data": {
                "transactions": transaction_items,
                "total_count": len(transaction_items)
            }
        }

    except Exception as e:
        logger.error(f"Get transaction history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history"
        )


@router.get("/folios")
async def get_investor_folios(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all folios for investor"""
    try:
        investor_service = InvestorService(db)
        folios = investor_service.get_investor_folios(current_user.investor_id)

        return {
            "message": "Folios retrieved successfully",
            "data": {
                "folios": folios,
                "total_count": len(folios)
            }
        }

    except Exception as e:
        logger.error(f"Get folios error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folios"
        )


@router.get("/sip/active")
async def get_active_sips(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get active SIP registrations"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        from app.models.mandate import SIPRegistration, SIPStatus
        active_sips = db.query(SIPRegistration).filter(
            SIPRegistration.investor_id == current_user.investor_id,
            SIPRegistration.status == SIPStatus.active
        ).all()

        # Get scheme names for display
        from app.models.scheme import Scheme
        schemes = {s.scheme_id: s.scheme_name for s in db.query(Scheme).all()}

        # Convert to dictionaries to avoid serialization issues
        sips_list = []
        for sip in active_sips:
            sips_list.append({
                "id": sip.id,
                "registration_id": sip.registration_id,
                "folio_number": sip.folio_number,
                "scheme_id": sip.scheme_id,
                "scheme_name": schemes.get(sip.scheme_id, sip.scheme_id),
                "amount": float(sip.amount) if sip.amount else 0.0,
                "frequency": sip.frequency.value if hasattr(sip.frequency, 'value') else str(sip.frequency),
                "start_date": sip.start_date.isoformat() if sip.start_date else None,
                "end_date": sip.end_date.isoformat() if sip.end_date else None,
                "number_of_installments": sip.number_of_installments,
                "total_installments_completed": sip.total_installments_completed or 0,
                "total_amount_invested": float(sip.total_amount_invested) if sip.total_amount_invested else 0.0,
                "status": sip.status.value if hasattr(sip.status, 'value') else str(sip.status),
                "next_installment_date": sip.next_installment_date.isoformat() if sip.next_installment_date else None,
                "bank_account_id": sip.bank_account_id
            })

        return {
            "message": "Active SIPs retrieved successfully",
            "data": sips_list
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get active SIPs error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active SIPs"
        )


@router.get("/swp/active")
async def get_active_swps(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get active SWP registrations"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        from app.models.mandate import SWPRegistration, SIPStatus
        active_swps = db.query(SWPRegistration).filter(
            SWPRegistration.investor_id == current_user.investor_id,
            SWPRegistration.status == SIPStatus.active
        ).all()

        # Get scheme names for display
        from app.models.scheme import Scheme
        schemes = {s.scheme_id: s.scheme_name for s in db.query(Scheme).all()}

        # Convert to dictionaries to avoid serialization issues
        swps_list = []
        for swp in active_swps:
            swps_list.append({
                "id": swp.id,
                "registration_id": swp.registration_id,
                "folio_number": swp.folio_number,
                "scheme_id": swp.scheme_id,
                "scheme_name": schemes.get(swp.scheme_id, swp.scheme_id),
                "amount": float(swp.amount) if swp.amount else 0.0,
                "frequency": swp.frequency.value if hasattr(swp.frequency, 'value') else str(swp.frequency),
                "start_date": swp.start_date.isoformat() if swp.start_date else None,
                "end_date": swp.end_date.isoformat() if swp.end_date else None,
                "number_of_installments": swp.number_of_installments,
                "total_installments_completed": swp.total_installments_completed or 0,
                "total_amount_withdrawn": float(swp.total_amount_withdrawn) if swp.total_amount_withdrawn else 0.0,
                "status": swp.status.value if hasattr(swp.status, 'value') else str(swp.status),
                "next_installment_date": swp.next_installment_date.isoformat() if swp.next_installment_date else None,
                "bank_account_id": swp.bank_account_id
            })

        return {
            "message": "Active SWPs retrieved successfully",
            "data": swps_list
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get active SWPs error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active SWPs"
        )


@router.get("/stp/active")
async def get_active_stps(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get active STP registrations"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        from app.models.mandate import STPRegistration, SIPStatus
        active_stps = db.query(STPRegistration).filter(
            STPRegistration.investor_id == current_user.investor_id,
            STPRegistration.status == SIPStatus.active
        ).all()

        # Get scheme names for display
        from app.models.scheme import Scheme
        schemes = {s.scheme_id: s.scheme_name for s in db.query(Scheme).all()}

        # Convert to dictionaries to avoid serialization issues
        stps_list = []
        for stp in active_stps:
            stps_list.append({
                "id": stp.id,
                "registration_id": stp.registration_id,
                "source_folio_number": stp.source_folio_number,
                "target_folio_number": stp.target_folio_number,
                "source_scheme_id": stp.source_scheme_id,
                "source_scheme_name": schemes.get(stp.source_scheme_id, stp.source_scheme_id),
                "target_scheme_id": stp.target_scheme_id,
                "target_scheme_name": schemes.get(stp.target_scheme_id, stp.target_scheme_id),
                "amount": float(stp.amount) if stp.amount else 0.0,
                "frequency": stp.frequency.value if hasattr(stp.frequency, 'value') else str(stp.frequency),
                "start_date": stp.start_date.isoformat() if stp.start_date else None,
                "end_date": stp.end_date.isoformat() if stp.end_date else None,
                "number_of_installments": stp.number_of_installments,
                "total_installments_completed": stp.total_installments_completed or 0,
                "total_amount_transferred": float(stp.total_amount_transferred) if stp.total_amount_transferred else 0.0,
                "status": stp.status.value if hasattr(stp.status, 'value') else str(stp.status),
                "next_installment_date": stp.next_installment_date.isoformat() if stp.next_installment_date else None
            })

        return {
            "message": "Active STPs retrieved successfully",
            "data": stps_list
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get active STPs error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active STPs"
        )


@router.get("/folio/{folio_number}")
async def get_folio_details(
    folio_number: str,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get detailed folio information"""
    try:
        from app.models.folio import Folio
        folio = db.query(Folio).filter(Folio.folio_number == folio_number).first()

        if not folio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folio not found"
            )

        if folio.investor_id != current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this folio"
            )

        # Get recent transactions for this folio
        recent_transactions = db.query(Transaction).filter(
            Transaction.folio_number == folio_number
        ).order_by(Transaction.transaction_date.desc()).limit(10).all()

        return {
            "message": "Folio details retrieved successfully",
            "data": {
                "folio": folio,
                "recent_transactions": recent_transactions
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get folio details error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folio details"
        )