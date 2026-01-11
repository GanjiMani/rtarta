from app.db.session import SessionLocal
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.user import User
from app.routers.investor.reports import get_capital_gains_report
import asyncio
from unittest.mock import MagicMock

async def test_all_reports():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.investor_id != None).all()
        years = ["2023-24", "2024-25", "2025-26"]
        
        for user in users:
            for year in years:
                try:
                    print(f"Testing investor {user.investor_id} for year {year}...")
                    result = await get_capital_gains_report(
                        financial_year=year,
                        current_user=user,
                        db=db
                    )
                except Exception as e:
                    print(f"FAILED for {user.investor_id} ({year}): {e}")
                    import traceback
                    traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_all_reports())
