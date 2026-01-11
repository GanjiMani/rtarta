from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional
from app.models.support import SupportTicket, TicketStatus, TicketPriority
from app.schemas.support import SupportTicketCreate

class SupportService:
    def __init__(self, db: Session):
        self.db = db

    def get_investor_tickets(self, investor_id: str) -> List[SupportTicket]:
        """Retrieve all support tickets for an investor"""
        return self.db.query(SupportTicket)\
            .filter(SupportTicket.investor_id == investor_id)\
            .order_by(desc(SupportTicket.created_at))\
            .all()

    def create_support_ticket(self, investor_id: str, data: SupportTicketCreate) -> SupportTicket:
        """Raise a new support ticket"""
        new_ticket = SupportTicket(
            investor_id=investor_id,
            subject=data.subject,
            message=data.message,
            priority=data.priority,
            status=TicketStatus.open
        )
        self.db.add(new_ticket)
        self.db.commit()
        self.db.refresh(new_ticket)
        return new_ticket

    def get_ticket_details(self, ticket_id: int, investor_id: str) -> Optional[SupportTicket]:
        """Get full details of a support ticket"""
        return self.db.query(SupportTicket)\
            .filter(SupportTicket.id == ticket_id, SupportTicket.investor_id == investor_id)\
            .first()

    def update_ticket(self, ticket_id: int, status: Optional[TicketStatus] = None, notes: Optional[str] = None) -> Optional[SupportTicket]:
        """Update ticket status or notes (Admin target, but for service logic completeness)"""
        ticket = self.db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if ticket:
            if status:
                ticket.status = status
            if notes:
                ticket.resolution_notes = notes
            if status == TicketStatus.resolved or status == TicketStatus.closed:
                ticket.resolved_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(ticket)
        return ticket
