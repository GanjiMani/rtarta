from app.db.session import SessionLocal
from app.models.transaction import Transaction
from app.models.investor import Investor
from app.models.scheme import Scheme
from sqlalchemy import desc

def check_transactions():
    db = SessionLocal()
    try:
        print("Connecting to database...")
        transactions = db.query(Transaction).order_by(desc(Transaction.transaction_date)).limit(10).all()
        count = db.query(Transaction).count()
        
        print(f"Total Transactions in DB: {count}")
        print("-" * 50)
        
        if not transactions:
            print("No transactions found.")
        
        for tx in transactions:
            investor = db.query(Investor).filter(Investor.investor_id == tx.investor_id).first()
            scheme = db.query(Scheme).filter(Scheme.scheme_id == tx.scheme_id).first()
            
            print(f"ID: {tx.transaction_id} | Type: {tx.transaction_type.value} | Amount: {tx.amount} | Status: {tx.status.value}")
            print(f"   Investor: {investor.full_name if investor else 'Unknown'} ({tx.investor_id})")
            print(f"   Scheme: {scheme.scheme_name if scheme else 'Unknown'} ({tx.scheme_id})")
            print("-" * 50)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_transactions()
