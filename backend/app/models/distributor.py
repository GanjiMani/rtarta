from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import BaseModel as SQLAlchemyBaseModel

# Association table for Investor-Distributor relationship (My Agents)
investor_agents = Table(
    "investor_agents",
    SQLAlchemyBaseModel.metadata,
    Column("investor_id", String(10), ForeignKey("investor_master.investor_id"), primary_key=True),
    Column("distributor_id", String(15), ForeignKey("distributor_master.distributor_id"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow)
)

class Distributor(SQLAlchemyBaseModel):
    """Distributor/Agent master data"""
    __tablename__ = "distributor_master"

    distributor_id = Column(String(15), unique=True, nullable=False, index=True) # ARN-123456
    name = Column(String(255), nullable=False)
    firm_name = Column(String(255), nullable=True)
    arn_number = Column(String(50), unique=True, nullable=False)
    
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(15), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True)
    experience_years = Column(Integer, default=0)
    rating = Column(DECIMAL(2, 1), default=5.0) # 0.0 to 5.0
    
    # Financial metrics (could be updated via batch jobs)
    total_aum = Column(DECIMAL(20, 2), default=0.0)
    commission_earned_ytd = Column(DECIMAL(15, 2), default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    investors = relationship("Investor", secondary=investor_agents, back_populates="agents")
    # A distributor can also be a User in the system
    users = relationship("User", back_populates="distributor")

    def __repr__(self):
        return f"<Distributor(id={self.id}, name={self.name}, arn={self.arn_number})>"
