from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime
from typing import List
from app.models.disclosure import Disclosure

class DisclosureService:
    def __init__(self, db: Session):
        self.db = db

    def get_active_disclosures(self) -> List[Disclosure]:
        """Fetch active (not expired) disclosures"""
        now = datetime.utcnow()
        return self.db.query(Disclosure)\
            .filter(or_(Disclosure.expiry_date == None, Disclosure.expiry_date > now))\
            .order_by(desc(Disclosure.is_mandatory), desc(Disclosure.published_date))\
            .all()

    def get_disclosure_by_id(self, disclosure_id: int) -> Disclosure:
        return self.db.query(Disclosure).filter(Disclosure.id == disclosure_id).first()
