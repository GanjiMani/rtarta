from app.db.session import SessionLocal
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.user import User
from app.routers.investor.reports import get_capital_gains_report
import asyncio
from unittest.mock import MagicMock

async def test_report():
    db = SessionLocal()
    try:
        # Mock user
        current_user = db.query(User).filter(User.investor_id != None).first()
        if not current_user:
            print("No investor found")
            return
            
        print(f"Testing for investor: {current_user.investor_id}")
        
        try:
            result = await get_capital_gains_report(
                financial_year="2024-25",
                current_user=current_user,
                db=db
            )
            print("Report generated successfully")
        except Exception as e:
            print(f"Caught exception: {e}")
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_report())
