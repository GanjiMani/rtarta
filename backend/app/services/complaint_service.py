from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.schemas.complaint import ComplaintCreate

class ComplaintService:
    def __init__(self, db: Session):
        self.db = db

    def get_investor_complaints(self, investor_id: str) -> List[Complaint]:
        """Retrieve complaints history for an investor"""
        return self.db.query(Complaint)\
            .filter(Complaint.investor_id == investor_id)\
            .order_by(desc(Complaint.created_at))\
            .all()

    def create_complaint(self, investor_id: str, data: ComplaintCreate) -> Complaint:
        """Submit a new complaint"""
        new_complaint = Complaint(
            investor_id=investor_id,
            subject=data.subject,
            description=data.description,
            category=data.category,
            reference_id=data.reference_id,
            status=ComplaintStatus.open
        )
        self.db.add(new_complaint)
        self.db.commit()
        self.db.refresh(new_complaint)
        return new_complaint

    def get_complaint_details(self, complaint_id: int, investor_id: str) -> Optional[Complaint]:
        """Get full details of a specific complaint"""
        return self.db.query(Complaint)\
            .filter(Complaint.id == complaint_id, Complaint.investor_id == investor_id)\
            .first()

    def update_complaint_status(self, complaint_id: int, status: ComplaintStatus, comments: Optional[str] = None) -> Optional[Complaint]:
        """Update complaint status (primarily for admin use, but included for completeness)"""
        complaint = self.db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if complaint:
            complaint.status = status
            if comments:
                complaint.resolution_comments = comments
            if status == ComplaintStatus.resolved or status == ComplaintStatus.closed:
                complaint.resolved_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(complaint)
        return complaint
