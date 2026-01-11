from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.distributor import Distributor
from app.models.investor import Investor

class DistributorService:
    def __init__(self, db: Session):
        self.db = db

    def get_investor_agents(self, investor_id: str) -> List[Distributor]:
        """Get all distributors (agents) mapped to an investor"""
        investor = self.db.query(Investor).filter(Investor.investor_id == investor_id).first()
        if not investor:
            return []
        return investor.agents

    def get_distributor_details(self, distributor_id: str) -> Optional[Distributor]:
        return self.db.query(Distributor).filter(Distributor.distributor_id == distributor_id).first()

    def search_distributors(self, query: str) -> List[Distributor]:
        return self.db.query(Distributor).filter(
            Distributor.name.ilike(f"%{query}%") | 
            Distributor.firm_name.ilike(f"%{query}%") |
            Distributor.arn_number.ilike(f"%{query}%")
        ).all()
