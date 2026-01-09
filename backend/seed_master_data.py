#!/usr/bin/env python3
"""Script to seed missing master data"""

from app.db.session import SessionLocal
from app.models.amc import AMC
from app.models.scheme import Scheme, SchemeType, PlanType, OptionType
from datetime import date

def seed_master_data():
    db = SessionLocal()
    try:
        print("Checking existing data...")

        # Check current counts
        amc_count = db.query(AMC).count()
        scheme_count = db.query(Scheme).count()
        print(f"Current: AMCs={amc_count}, Schemes={scheme_count}")

        # Add AMCs if missing
        if amc_count == 0:
            print("Adding AMCs...")
            amcs = [
                AMC(
                    amc_id='AMC001',
                    amc_name='Quantum Mutual Fund',
                    registration_number='ARN-123456',
                    address='123 Business District, Mumbai, Maharashtra',
                    city='Mumbai',
                    state='Maharashtra',
                    pincode='400001',
                    email='info@quantummf.com',
                    phone='022-12345678',
                    website='https://www.quantummf.com'
                ),
                AMC(
                    amc_id='AMC002',
                    amc_name='Alpha Capital',
                    registration_number='ARN-234567',
                    address='456 Finance Tower, Delhi, Delhi',
                    city='Delhi',
                    state='Delhi',
                    pincode='110001',
                    email='contact@alphacapital.com',
                    phone='011-23456789',
                    website='https://www.alphacapital.com'
                )
            ]
            for amc in amcs:
                db.add(amc)
            print(f"Added {len(amcs)} AMCs")

        # Add Schemes if missing
        if scheme_count == 0:
            print("Adding Schemes...")
            schemes = [
                Scheme(
                    scheme_id='SCH001',
                    amc_id='AMC001',
                    scheme_name='Quantum Equity Fund',
                    scheme_type=SchemeType.equity,
                    plan_type=PlanType.direct,
                    option_type=OptionType.growth,
                    current_nav=150.25,
                    nav_date=date.today(),
                    minimum_investment=500.0,
                    additional_investment=100.0,
                    exit_load_percentage=1.0,
                    exit_load_period_days=365,
                    risk_category='high',
                    fund_manager='Amit Shah',
                    benchmark_index='Nifty 50',
                    is_active=True,
                    is_open_for_investment=True,
                    is_open_for_redemption=True
                ),
                Scheme(
                    scheme_id='SCH002',
                    amc_id='AMC001',
                    scheme_name='Quantum Debt Fund',
                    scheme_type=SchemeType.debt,
                    plan_type=PlanType.regular,
                    option_type=OptionType.idcw_payout,
                    current_nav=12.85,
                    nav_date=date.today(),
                    minimum_investment=1000.0,
                    additional_investment=500.0,
                    exit_load_percentage=0.0,
                    exit_load_period_days=0,
                    risk_category='low',
                    fund_manager='Sneha Patel',
                    benchmark_index='CRISIL Short Term Bond Index',
                    is_active=True,
                    is_open_for_investment=True,
                    is_open_for_redemption=True
                ),
                Scheme(
                    scheme_id='SCH003',
                    amc_id='AMC002',
                    scheme_name='Alpha Balanced Advantage',
                    scheme_type=SchemeType.hybrid,
                    plan_type=PlanType.direct,
                    option_type=OptionType.growth,
                    current_nav=25.40,
                    nav_date=date.today(),
                    minimum_investment=100.0,
                    additional_investment=100.0,
                    exit_load_percentage=1.0,
                    exit_load_period_days=365,
                    risk_category='moderate',
                    fund_manager='Vikram Joshi',
                    benchmark_index='Nifty 50 Hybrid Composite Debt 50:50 Index',
                    is_active=True,
                    is_open_for_investment=True,
                    is_open_for_redemption=True
                )
            ]
            for scheme in schemes:
                db.add(scheme)
            print(f"Added {len(schemes)} Schemes")

        db.commit()
        print("✅ Master data seeding completed successfully!")

        # Verify final counts
        final_amc = db.query(AMC).count()
        final_scheme = db.query(Scheme).count()
        print(f"Final: AMCs={final_amc}, Schemes={final_scheme}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_master_data()
