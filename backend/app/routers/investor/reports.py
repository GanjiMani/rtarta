from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import date, timedelta
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.transaction import Transaction
from app.models.folio import Folio, FolioStatus
from app.models.scheme import Scheme
from app.models.investor import Investor
from app.models.amc import AMC
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/capital-gains")
async def get_capital_gains_report(
    financial_year: str = None,  # Format: "2023-24"
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Generate capital gains report"""
    try:
        # Determine financial year
        if not financial_year:
            current_year = date.today().year
            if date.today().month <= 3:
                financial_year = f"{current_year-1}-{str(current_year)[-2:]}"
            else:
                financial_year = f"{current_year}-{str(current_year+1)[-2:]}"

        # Parse financial year
        start_year = int(financial_year.split('-')[0])
        end_year = 2000 + int(financial_year.split('-')[1])

        fy_start = date(start_year, 4, 1)
        fy_end = date(end_year, 3, 31)

        # Get all transactions for the investor in this FY
        transactions = db.query(Transaction).filter(
            Transaction.investor_id == current_user.investor_id,
            Transaction.transaction_date >= fy_start,
            Transaction.transaction_date <= fy_end,
            Transaction.status == TransactionStatus.completed
        ).order_by(Transaction.transaction_date).all()

        # Calculate capital gains (simplified version)
        capital_gains = {
            "short_term": {"total": 0, "transactions": []},
            "long_term": {"total": 0, "transactions": []}
        }

        # This is a simplified calculation
        # In production, this would be much more complex with proper cost basis tracking
        for transaction in transactions:
            if transaction.transaction_type.value in ['redemption', 'switch_redemption']:
                # Simplified: assume all gains are short-term for this example
                gain_loss = transaction.amount  # This would be calculated properly
                capital_gains["short_term"]["total"] += gain_loss
                capital_gains["short_term"]["transactions"].append({
                    "transaction_id": transaction.transaction_id,
                    "scheme_id": transaction.scheme_id,
                    "date": transaction.transaction_date,
                    "amount": transaction.amount,
                    "gain_loss": gain_loss
                })

        return {
            "message": "Capital gains report generated successfully",
            "data": {
                "financial_year": financial_year,
                "period": {
                    "start_date": fy_start,
                    "end_date": fy_end
                },
                "capital_gains": capital_gains,
                "total_taxable_gain": capital_gains["short_term"]["total"] + capital_gains["long_term"]["total"]
            }
        }

    except Exception as e:
        logger.error(f"Capital gains report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate capital gains report"
        )


@router.get("/valuation")
async def get_valuation_report(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Generate portfolio valuation report"""
    try:
        # Get all active folios
        folios = db.query(Folio).filter(
            Folio.investor_id == current_user.investor_id,
            Folio.status == FolioStatus.active
        ).all()

        valuation_data = []
        total_current_value = 0
        total_investment = 0

        for folio in folios:
            # Get scheme details
            scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            if not scheme:
                continue

            current_nav = scheme.current_nav
            current_value = folio.total_units * current_nav
            gain_loss = current_value - folio.total_investment
            gain_loss_percentage = (gain_loss / folio.total_investment * 100) if folio.total_investment > 0 else 0

            valuation_data.append({
                "folio_number": folio.folio_number,
                "scheme_name": scheme.scheme_name,
                "scheme_type": scheme.scheme_type.value,
                "total_units": folio.total_units,
                "current_nav": current_nav,
                "total_investment": folio.total_investment,
                "current_value": current_value,
                "gain_loss": gain_loss,
                "gain_loss_percentage": gain_loss_percentage,
                "last_updated": folio.updated_at.date()
            })

            total_current_value += current_value
            total_investment += folio.total_investment

        return {
            "message": "Valuation report generated successfully",
            "data": {
                "report_date": date.today(),
                "total_folios": len(valuation_data),
                "total_investment": total_investment,
                "total_current_value": total_current_value,
                "total_gain_loss": total_current_value - total_investment,
                "total_gain_loss_percentage": ((total_current_value - total_investment) / total_investment * 100) if total_investment > 0 else 0,
                "folio_valuations": valuation_data
            }
        }

    except Exception as e:
        logger.error(f"Valuation report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate valuation report"
        )


@router.get("/cas")
async def download_cas(
    from_date: date = None,
    to_date: date = None,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Generate Consolidated Account Statement (CAS)"""
    try:
        # Set default date range (last 2 years)
        if not from_date:
            from_date = date.today() - timedelta(days=730)
        if not to_date:
            to_date = date.today()

        # Get all transactions in date range
        transactions = db.query(Transaction).filter(
            Transaction.investor_id == current_user.investor_id,
            Transaction.transaction_date >= from_date,
            Transaction.transaction_date <= to_date,
            Transaction.status == TransactionStatus.completed
        ).order_by(Transaction.transaction_date).all()

        # Get current portfolio holdings
        folios = db.query(Folio).filter(
            Folio.investor_id == current_user.investor_id,
            Folio.status == FolioStatus.active
        ).all()

        # Get investor details
        investor = db.query(Investor).filter(Investor.investor_id == current_user.investor_id).first()

        # Group transactions by scheme
        scheme_transactions = {}
        for txn in transactions:
            if txn.scheme_id not in scheme_transactions:
                scheme_transactions[txn.scheme_id] = []
            scheme_transactions[txn.scheme_id].append(txn)

        # Generate CAS data
        cas_data = {
            "investor_info": {
                "investor_id": current_user.investor_id,
                "name": investor.full_name if investor else current_user.email.split('@')[0],
                "email": current_user.email,
                "pan": investor.pan_number if investor else "",
            },
            "statement_period": {
                "from_date": from_date.isoformat() if from_date else None,
                "to_date": to_date.isoformat() if to_date else None
            },
            "schemes": []
        }

        for folio in folios:
            scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()
            if not scheme:
                continue

            # Get AMC details
            amc = db.query(AMC).filter(AMC.amc_id == folio.amc_id).first()

            scheme_data = {
                "scheme_id": folio.scheme_id,
                "scheme_name": scheme.scheme_name,
                "amc_name": amc.amc_name if amc else "",
                "folio_number": folio.folio_number,
                "current_holdings": {
                    "units": float(folio.total_units) if folio.total_units else 0.0,
                    "nav": float(scheme.current_nav) if scheme.current_nav else 0.0,
                    "value": float(folio.total_value) if folio.total_value else 0.0
                },
                "transactions": []
            }

            # Add transactions for this scheme
            if folio.scheme_id in scheme_transactions:
                for txn in scheme_transactions[folio.scheme_id]:
                    scheme_data["transactions"].append({
                        "transaction_id": txn.transaction_id,
                        "date": txn.transaction_date.isoformat() if txn.transaction_date else None,
                        "type": txn.transaction_type.value if hasattr(txn.transaction_type, 'value') else str(txn.transaction_type),
                        "amount": float(txn.amount) if txn.amount else 0.0,
                        "units": float(txn.units) if txn.units else 0.0,
                        "nav": float(txn.nav_per_unit) if txn.nav_per_unit else 0.0,
                        "status": txn.status.value if hasattr(txn.status, 'value') else str(txn.status)
                    })

            cas_data["schemes"].append(scheme_data)

        return {
            "message": "CAS generated successfully",
            "data": cas_data
        }

    except Exception as e:
        logger.error(f"CAS generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate CAS"
        )


@router.get("/transaction-summary")
async def get_transaction_summary(
    from_date: date = None,
    to_date: date = None,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get transaction summary report"""
    try:
        # Set default date range (last 30 days)
        if not from_date:
            from_date = date.today() - timedelta(days=30)
        if not to_date:
            to_date = date.today()

        # Get transaction summary
        transactions = db.query(Transaction).filter(
            Transaction.investor_id == current_user.investor_id,
            Transaction.transaction_date >= from_date,
            Transaction.transaction_date <= to_date,
            Transaction.status == TransactionStatus.completed
        ).all()

        # Calculate summary statistics
        summary = {
            "period": {
                "from_date": from_date,
                "to_date": to_date
            },
            "transaction_counts": {
                "total": len(transactions),
                "purchase": 0,
                "redemption": 0,
                "sip": 0,
                "switch": 0
            },
            "amounts": {
                "total_invested": 0,
                "total_redeemed": 0,
                "net_investment": 0
            },
            "schemes_involved": set()
        }

        for txn in transactions:
            txn_type = txn.transaction_type.value

            if txn_type in ['fresh_purchase', 'additional_purchase']:
                summary["transaction_counts"]["purchase"] += 1
                summary["amounts"]["total_invested"] += txn.amount
            elif txn_type == 'redemption':
                summary["transaction_counts"]["redemption"] += 1
                summary["amounts"]["total_redeemed"] += txn.amount
            elif txn_type == 'sip':
                summary["transaction_counts"]["sip"] += 1
                summary["amounts"]["total_invested"] += txn.amount
            elif txn_type in ['switch_redemption', 'switch_purchase']:
                summary["transaction_counts"]["switch"] += 1

            summary["schemes_involved"].add(txn.scheme_id)

        summary["amounts"]["net_investment"] = summary["amounts"]["total_invested"] - summary["amounts"]["total_redeemed"]
        summary["schemes_involved"] = len(summary["schemes_involved"])

        return {
            "message": "Transaction summary generated successfully",
            "data": summary
        }

    except Exception as e:
        logger.error(f"Transaction summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate transaction summary"
        )


@router.get("/folio-summary/{folio_number}")
async def get_folio_summary_report(
    folio_number: str,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get detailed folio summary report"""
    try:
        # Get folio
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

        # Get scheme details
        scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first()

        # Get transaction history for this folio
        transactions = db.query(Transaction).filter(
            Transaction.folio_number == folio_number,
            Transaction.status == TransactionStatus.completed
        ).order_by(Transaction.transaction_date.desc()).all()

        # Calculate performance metrics
        total_invested = sum(t.amount for t in transactions if t.is_debit_transaction())
        total_redeemed = sum(t.amount for t in transactions if t.is_credit_transaction())
        net_investment = total_invested - total_redeemed

        return {
            "message": "Folio summary generated successfully",
            "data": {
                "folio_info": {
                    "folio_number": folio.folio_number,
                    "scheme_name": scheme.scheme_name if scheme else "",
                    "scheme_type": scheme.scheme_type.value if scheme else "",
                    "status": folio.status.value,
                    "created_date": folio.created_at.date()
                },
                "holdings": {
                    "total_units": folio.total_units,
                    "current_nav": folio.current_nav,
                    "current_value": folio.total_value,
                    "total_investment": folio.total_investment,
                    "average_cost_per_unit": folio.average_cost_per_unit,
                    "gain_loss": folio.unrealized_gain_loss,
                    "gain_loss_percentage": folio.gain_loss_percentage
                },
                "transaction_summary": {
                    "total_transactions": len(transactions),
                    "total_invested": total_invested,
                    "total_redeemed": total_redeemed,
                    "net_investment": net_investment,
                    "first_transaction": transactions[-1].transaction_date if transactions else None,
                    "last_transaction": transactions[0].transaction_date if transactions else None
                },
                "recent_transactions": transactions[:10]  # Last 10 transactions
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Folio summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate folio summary"
        )