from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Dict, Any, List, Optional
from datetime import date, timedelta, datetime
from decimal import Decimal
from app.db.session import get_db
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.folio import Folio, FolioStatus
from app.models.scheme import Scheme, SchemeType
from app.models.investor import Investor
from app.models.amc import AMC
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def calculate_capital_gains_fifo(purchases: List[Dict], redemptions: List[Dict]) -> List[Dict]:
    """
    Calculate capital gains using FIFO (First In First Out) method
    
    Args:
        purchases: List of purchase transactions with units, nav, date
        redemptions: List of redemption transactions with units, nav, date
    
    Returns:
        List of capital gains with holding period, cost basis, and gain/loss
    """
    capital_gains = []
    purchase_queue = purchases.copy()  # Queue of remaining purchase units
    
    for redemption in redemptions:
        redeemed_units = Decimal(str(redemption['units']))
        redemption_nav = Decimal(str(redemption['nav']))
        redemption_date = redemption['date']
        redemption_amount = redeemed_units * redemption_nav
        
        remaining_units = redeemed_units
        cost_basis = Decimal('0')
        
        # Match redemption with purchases using FIFO
        while remaining_units > 0 and purchase_queue:
            purchase = purchase_queue[0]
            available_units = Decimal(str(purchase['remaining_units']))
            purchase_nav = Decimal(str(purchase['nav']))
            purchase_date = purchase['date']
            
            # Units to match from this purchase
            units_to_match = min(remaining_units, available_units)
            
            # Calculate cost basis for these units
            cost_for_units = units_to_match * purchase_nav
            cost_basis += cost_for_units
            
            # Calculate holding period
            holding_days = (redemption_date - purchase_date).days
            holding_years = holding_days / 365.0
            
            # Determine if long-term or short-term (1 year for equity, 3 years for debt)
            is_equity = purchase.get('is_equity', True)
            threshold_years = 1 if is_equity else 3
            is_long_term = holding_years >= threshold_years
            
            # Calculate gain/loss for this portion
            sale_value = units_to_match * redemption_nav
            gain_loss = sale_value - cost_for_units
            
            capital_gains.append({
                'transaction_id': redemption['transaction_id'],
                'scheme_id': redemption['scheme_id'],
                'scheme_name': redemption.get('scheme_name', ''),
                'purchase_date': purchase_date,
                'redemption_date': redemption_date,
                'units': float(units_to_match),
                'purchase_nav': float(purchase_nav),
                'redemption_nav': float(redemption_nav),
                'cost_basis': float(cost_for_units),
                'sale_value': float(sale_value),
                'gain_loss': float(gain_loss),
                'holding_period_days': holding_days,
                'holding_period_years': round(holding_years, 2),
                'is_long_term': is_long_term,
                'is_equity': is_equity
            })
            
            # Update remaining units
            remaining_units -= units_to_match
            purchase['remaining_units'] = float(available_units - units_to_match)
            
            # Remove purchase from queue if fully consumed
            if purchase['remaining_units'] <= 0:
                purchase_queue.pop(0)
    
    return capital_gains


@router.get("/capital-gains")
async def get_capital_gains_report(
    financial_year: str = Query(None, description="Format: 2023-24"),
    folio_number: Optional[str] = Query(None, description="Filter by specific folio"),
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive capital gains report with FIFO calculation
    
    Calculates:
    - Short-term capital gains (STCG): Equity < 1 year, Debt < 3 years
    - Long-term capital gains (LTCG): Equity >= 1 year, Debt >= 3 years
    - Proper cost basis using FIFO method
    - Tax implications based on current Indian tax laws
    """
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Determine financial year
        if not financial_year:
            current_year = date.today().year
            if date.today().month <= 3:
                financial_year = f"{current_year-1}-{str(current_year)[-2:]}"
            else:
                financial_year = f"{current_year}-{str(current_year+1)[-2:]}"
        
        # Parse financial year
        try:
            start_year = int(financial_year.split('-')[0])
            end_year_suffix = int(financial_year.split('-')[1])
            end_year = 2000 + end_year_suffix if end_year_suffix < 100 else end_year_suffix
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid financial year format. Use YYYY-YY (e.g., 2023-24)"
            )
        
        fy_start = date(start_year, 4, 1)
        fy_end = date(end_year, 3, 31)
        
        # Build query for redemptions in the financial year
        redemption_query = db.query(Transaction).filter(
            Transaction.investor_id == current_user.investor_id,
            Transaction.transaction_date >= fy_start,
            Transaction.transaction_date <= fy_end,
            Transaction.status == TransactionStatus.completed,
            Transaction.transaction_type.in_([
                TransactionType.redemption,
                TransactionType.switch_redemption
            ])
        )
        
        if folio_number:
            redemption_query = redemption_query.filter(Transaction.folio_number == folio_number)
        
        redemptions = redemption_query.order_by(Transaction.transaction_date).all()
        
        if not redemptions:
            return {
                "message": "No redemptions found for the specified period",
                "data": {
                    "financial_year": financial_year,
                    "period": {
                        "start_date": fy_start.isoformat(),
                        "end_date": fy_end.isoformat()
                    },
                    "capital_gains": {
                        "short_term": {"total": 0, "transactions": []},
                        "long_term": {"total": 0, "transactions": []}
                    },
                    "summary": {
                        "total_short_term": 0,
                        "total_long_term": 0,
                        "total_taxable_gain": 0,
                        "total_transactions": 0
                    },
                    "tax_implications": {
                        "stcg_tax_rate": "As per income tax slab",
                        "ltcg_equity_tax_rate": "10% (above ₹1 lakh exemption)",
                        "ltcg_debt_tax_rate": "20% with indexation"
                    }
                }
            }
        
        # Group redemptions by folio for FIFO calculation
        folio_redemptions = {}
        for redemption in redemptions:
            if redemption.folio_number not in folio_redemptions:
                folio_redemptions[redemption.folio_number] = []
            folio_redemptions[redemption.folio_number].append(redemption)
        
        all_capital_gains = []
        
        # Process each folio
        for folio_num, folio_redemptions_list in folio_redemptions.items():
            # Get all purchases for this folio (before or on redemption dates)
            max_redemption_date = max(r.transaction_date for r in folio_redemptions_list)
            
            purchases = db.query(Transaction).filter(
                Transaction.investor_id == current_user.investor_id,
                Transaction.folio_number == folio_num,
                Transaction.transaction_date <= max_redemption_date,
                Transaction.status == TransactionStatus.completed,
                Transaction.transaction_type.in_([
                    TransactionType.fresh_purchase,
                    TransactionType.additional_purchase,
                    TransactionType.sip,
                    TransactionType.switch_purchase
                ])
            ).order_by(Transaction.transaction_date).all()
            
            if not purchases:
                continue
            
            # Get scheme details to determine equity/debt
            folio = db.query(Folio).filter(Folio.folio_number == folio_num).first()
            scheme = db.query(Scheme).filter(Scheme.scheme_id == folio.scheme_id).first() if folio else None
            is_equity = scheme.scheme_type == SchemeType.equity if scheme else True
            
            # Prepare purchase data for FIFO
            purchase_data = []
            for p in purchases:
                purchase_data.append({
                    'transaction_id': p.transaction_id,
                    'date': p.transaction_date,
                    'units': float(p.units),
                    'remaining_units': float(p.units),
                    'nav': float(p.nav_per_unit),
                    'is_equity': is_equity
                })
            
            # Prepare redemption data
            redemption_data = []
            for r in folio_redemptions_list:
                scheme_name = scheme.scheme_name if scheme else r.scheme_id
                redemption_data.append({
                    'transaction_id': r.transaction_id,
                    'scheme_id': r.scheme_id,
                    'scheme_name': scheme_name,
                    'date': r.transaction_date,
                    'units': float(r.units),
                    'nav': float(r.nav_per_unit),
                    'is_equity': is_equity
                })
            
            # Calculate capital gains using FIFO
            folio_gains = calculate_capital_gains_fifo(purchase_data, redemption_data)
            all_capital_gains.extend(folio_gains)
        
        # Categorize gains into short-term and long-term
        short_term_gains = []
        long_term_gains = []
        short_term_total = Decimal('0')
        long_term_total = Decimal('0')
        
        for gain in all_capital_gains:
            if gain['is_long_term']:
                long_term_gains.append(gain)
                long_term_total += Decimal(str(gain['gain_loss']))
            else:
                short_term_gains.append(gain)
                short_term_total += Decimal(str(gain['gain_loss']))
        
        total_taxable_gain = short_term_total + long_term_total
        
        return {
            "message": "Capital gains report generated successfully",
            "data": {
                "financial_year": financial_year,
                "period": {
                    "start_date": fy_start.isoformat(),
                    "end_date": fy_end.isoformat()
                },
                "capital_gains": {
                    "short_term": {
                        "total": float(short_term_total),
                        "count": len(short_term_gains),
                        "transactions": short_term_gains
                    },
                    "long_term": {
                        "total": float(long_term_total),
                        "count": len(long_term_gains),
                        "transactions": long_term_gains
                    }
                },
                "summary": {
                    "total_short_term": float(short_term_total),
                    "total_long_term": float(long_term_total),
                    "total_taxable_gain": float(total_taxable_gain),
                    "total_transactions": len(all_capital_gains)
                },
                "tax_implications": {
                    "stcg_tax_rate": "As per your income tax slab",
                    "ltcg_equity_tax_rate": "10% on gains above ₹1,00,000 (without indexation)",
                    "ltcg_debt_tax_rate": "20% with indexation benefit",
                    "note": "Please consult a tax advisor for accurate tax calculations"
                }
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Capital gains report error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate capital gains report: {str(e)}"
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
                "total_units": float(folio.total_units),
                "current_nav": float(current_nav),
                "total_investment": float(folio.total_investment),
                "current_value": float(current_value),
                "gain_loss": float(gain_loss),
                "gain_loss_percentage": float(gain_loss_percentage),
                "last_updated": folio.updated_at.date().isoformat()
            })

            total_current_value += current_value
            total_investment += folio.total_investment

        return {
            "message": "Valuation report generated successfully",
            "data": {
                "report_date": date.today().isoformat(),
                "total_folios": len(valuation_data),
                "total_investment": float(total_investment),
                "total_current_value": float(total_current_value),
                "total_gain_loss": float(total_current_value - total_investment),
                "total_gain_loss_percentage": float(((total_current_value - total_investment) / total_investment * 100) if total_investment > 0 else 0),
                "folio_valuations": valuation_data
            }
        }

    except Exception as e:
        logger.error(f"Valuation report error: {e}", exc_info=True)
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
        logger.error(f"CAS generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate CAS"
        )