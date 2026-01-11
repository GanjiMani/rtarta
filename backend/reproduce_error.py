import asyncio
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.routers.investor.reports import get_capital_gains_report
from unittest.mock import MagicMock

async def reproduce():
    db = SessionLocal()
    try:
        # Get first investor user
        user = db.query(User).filter(User.investor_id != None).first()
        if not user:
            print("No investor user found for reproduction")
            return
            
        print(f"Testing for user: {user.email} (ID: {user.investor_id})")
        
        try:
            # Call the router function directly
            result = await get_capital_gains_report(
                financial_year="2023-24",
                current_user=user,
                db=db
            )
            print("Success! Report generated.")
            # print(result)
        except Exception as e:
            print(f"REPRODUCED ERROR: {e}")
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
