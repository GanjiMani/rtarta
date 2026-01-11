import sys
import os
from decimal import Decimal
from datetime import date
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.transaction_service import TransactionService
from app.models.unclaimed import UnclaimedAmount, UnclaimedStatus
from app.models.transaction import Transaction, TransactionType
from app.models.scheme import Scheme

def test_process_unclaimed_claim():
    print("Testing process_unclaimed_claim...")
    
    # Mock DB Session
    mock_db = MagicMock()
    service = TransactionService(mock_db)
    
    # Mock ID generation to avoid complex query mocking
    service.generate_transaction_id = MagicMock(return_value="T101")
    
    # Mock Data
    investor_id = "I001"
    unclaimed_id = "UNC001"
    
    mock_unclaimed = UnclaimedAmount(
        unclaimed_id=unclaimed_id,
        investor_id=investor_id,
        folio_number="F001",
        scheme_id="S001",
        amount=Decimal('1000.00'),
        accumulated_income=Decimal('50.00'),
        total_amount=Decimal('1050.00'),
        status=UnclaimedStatus.pending,
        claimed=False
    )
    
    mock_scheme = Scheme(
        scheme_id="S001",
        amc_id="AMC001"
    )
    
    # Setup Mock Query Results
    # First query for UnclaimedAmount
    # Second query for Scheme (inside the method)
    
    def side_effect(model):
        query_mock = MagicMock()
        if model is UnclaimedAmount:
            query_mock.filter.return_value.first.return_value = mock_unclaimed
        elif model is Scheme:
            query_mock.filter.return_value.first.return_value = mock_scheme
        # Transaction ID generation is mocked directly on service
        return query_mock

    mock_db.query.side_effect = side_effect
    
    # Execute
    try:
        txn = service.process_unclaimed_claim(unclaimed_id, investor_id)
        
        # Verify
        print(f"Transaction Created: {txn.transaction_id}")
        print(f"Amount: {txn.amount}")
        print(f"Type: {txn.transaction_type}")
        print(f"Status: {mock_unclaimed.status}")
        
        if txn.amount == Decimal('1000.00') + Decimal('50.00') and \
           txn.transaction_type == TransactionType.unclaimed_payout and \
           mock_unclaimed.status == UnclaimedStatus.claimed and \
           mock_unclaimed.claimed is True:
            print("SUCCESS: Logic verified correctly.")
        else:
            print("FAILURE: Logic check failed.")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_process_unclaimed_claim()
