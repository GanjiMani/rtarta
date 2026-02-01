from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import Optional
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.folio import Folio
from app.models.investor import Investor
from app.models.admin import SystemAlert, SystemAlertType, AuditLog, BatchJob, BatchJobStatus
from app.models.scheme import Scheme
from app.models.amc import AMC
from app.models.unclaimed import UnclaimedAmount
from app.core.jwt import get_current_user
from app.core.permissions import has_permission
from app.core.roles import AdminPermissions
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/admindashboard")
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.VIEW_DASHBOARD))
):
    """Get comprehensive admin dashboard metrics"""
    
    
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Transaction Statistics
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
    pending_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.status == TransactionStatus.pending
    ).scalar() or 0
    completed_today = db.query(func.count(Transaction.id)).filter(
        and_(
            Transaction.status == TransactionStatus.completed,
            func.date(Transaction.completion_date) == today
        )
    ).scalar() or 0
    
    # Financial Metrics
    total_aum = db.query(func.sum(Folio.total_value)).scalar() or 0
    total_investors = db.query(func.count(Investor.id)).filter(
        Investor.is_active == True
    ).scalar() or 0
    total_folios = db.query(func.count(Folio.id)).filter(
        Folio.status == "active"
    ).scalar() or 0
    
    # Fund Flow (Last 7 days)
    fund_flow_data = []
    for i in range(7):
        date = today - timedelta(days=i)
        inflows = db.query(func.sum(Transaction.amount)).filter(
            and_(
                func.date(Transaction.transaction_date) == date,
                Transaction.transaction_type.in_([
                    TransactionType.fresh_purchase,
                    TransactionType.additional_purchase,
                    TransactionType.sip
                ]),
                Transaction.status == TransactionStatus.completed
            )
        ).scalar() or 0
        
        outflows = db.query(func.sum(Transaction.amount)).filter(
            and_(
                func.date(Transaction.transaction_date) == date,
                Transaction.transaction_type.in_([
                    TransactionType.redemption,
                    TransactionType.swp
                ]),
                Transaction.status == TransactionStatus.completed
            )
        ).scalar() or 0
        
        fund_flow_data.append({
            "day": date.strftime("%Y-%m-%d"),
            "inflow": float(inflows),
            "outflow": float(outflows)
        })
    
    fund_flow_data.reverse()
    
    # Reconciliation Status
    reconciliation_data = [
        {"name": "Reconciled", "value": 85},
        {"name": "Pending", "value": 15}
    ]
    
    # Recent Activity (Last 10 transactions)
    recent_activity = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).limit(10).all()
    
    activity_list = []
    for tx in recent_activity:
        activity_list.append({
            "id": tx.transaction_id,
            "action": f"{tx.transaction_type.value.replace('_', ' ').title()} - ₹{tx.amount}",
            "time": tx.created_at.strftime("%Y-%m-%d %H:%M") if tx.created_at else "N/A"
        })
    
    # System Alerts
    critical_alerts = db.query(SystemAlert).filter(
        and_(
            SystemAlert.alert_type == SystemAlertType.critical,
            SystemAlert.is_active == True
        )
    ).limit(5).all()
    
    alert_list = []
    for alert in critical_alerts:
        alert_list.append({
            "id": alert.alert_id,
            "type": alert.alert_type.value,
            "msg": alert.message,
            "title": alert.title
        })
    
    # Stats Cards
    stats = [
        {
            "name": "Total Transactions",
            "value": f"{total_transactions:,}",
            "icon": "FileText",
            "color": "text-blue-600",
            "link": "/admin/transactions"
        },
        {
            "name": "Pending Approvals",
            "value": f"{pending_transactions:,}",
            "icon": "Clock",
            "color": "text-yellow-600",
            "link": "/admin/approvals"
        },
        {
            "name": "Total AUM",
            "value": f"₹{total_aum:,.2f}",
            "icon": "TrendingUp",
            "color": "text-green-600",
            "link": None
        },
        {
            "name": "Active Investors",
            "value": f"{total_investors:,}",
            "icon": "Users",
            "color": "text-purple-600",
            "link": None
        }
    ]
    
    return {
        "stats": stats,
        "recent_activity": activity_list,
        "fund_flow": fund_flow_data,
        "reconciliation": reconciliation_data,
        "system_alerts": alert_list
    }


@router.get("/dashboard/metrics")
async def get_detailed_metrics(
    period: str = Query("7d", regex="^(7d|30d|90d|1y)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission(AdminPermissions.VIEW_DASHBOARD))
):
    """Get detailed metrics for charts and analytics"""
    
    
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map.get(period, 7)
    start_date = datetime.now().date() - timedelta(days=days)
    
    # Transaction volume over time
    transaction_volume = db.query(
        func.date(Transaction.transaction_date).label("date"),
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("amount")
    ).filter(
        and_(
            Transaction.transaction_date >= start_date,
            Transaction.status == TransactionStatus.completed
        )
    ).group_by(func.date(Transaction.transaction_date)).all()
    
    volume_data = [
        {
            "date": row.date.strftime("%Y-%m-%d"),
            "count": row.count,
            "amount": float(row.amount or 0)
        }
        for row in transaction_volume
    ]
    
    # Transaction type distribution
    type_distribution = db.query(
        Transaction.transaction_type,
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.transaction_date >= start_date
    ).group_by(Transaction.transaction_type).all()
    
    type_data = [
        {
            "type": tx_type.value.replace("_", " ").title(),
            "count": count
        }
        for tx_type, count in type_distribution
    ]
    
    # Scheme performance
    scheme_performance = db.query(
        Scheme.scheme_name,
        func.count(Folio.id).label("folio_count"),
        func.sum(Folio.total_value).label("total_value")
    ).join(Folio, Scheme.scheme_id == Folio.scheme_id).group_by(
        Scheme.scheme_id, Scheme.scheme_name
    ).limit(10).all()
    
    scheme_data = [
        {
            "scheme": row.scheme_name,
            "folios": row.folio_count,
            "aum": float(row.total_value or 0)
        }
        for row in scheme_performance
    ]
    
    return {
        "transaction_volume": volume_data,
        "type_distribution": type_data,
        "scheme_performance": scheme_data
    }


