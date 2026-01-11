from app.db.session import SessionLocal
from sqlalchemy import text

def check_all_tables():
    db = SessionLocal()
    try:
        # Get all tables
        tables = db.execute(text("SHOW TABLES")).fetchall()
        for table in tables:
            tname = table[0]
            # Search for 'switch_out' in any column
            try:
                result = db.execute(text(f"SELECT * FROM {tname}")).fetchall()
                for row in result:
                    if 'switch_out' in str(row):
                        print(f"FOUND 'switch_out' in table {tname}: {row}")
            except Exception as e:
                pass
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_all_tables()
