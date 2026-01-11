from app.db.session import SessionLocal
from app.models.transaction import Transaction
from sqlalchemy import text

def check_db_types():
    db = SessionLocal()
    try:
        # Check raw database values to bypass enum validation
        result = db.execute(text("SELECT DISTINCT transaction_type FROM transaction_history")).fetchall()
        print("Existing transaction types in DB:", [r[0] for r in result])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db_types()
