from sqlalchemy import Column, String, Text, Boolean, Integer, DECIMAL
from sqlalchemy.orm import relationship
from app.db.base import BaseModel


class AMC(BaseModel):
    """Asset Management Company master data"""

    __tablename__ = "amc_master"

    amc_id = Column(String(10), unique=True, nullable=False, index=True)  # A001, A002, etc.
    amc_name = Column(String(255), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    contact_person = Column(String(255))
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(15), nullable=False)
    website = Column(String(255))
    is_active = Column(Boolean, default=True, nullable=False)
    compliance_status = Column(String(50), default="compliant")  # compliant, under_review, suspended

    # Relationships
    schemes = relationship("Scheme", back_populates="amc", cascade="all, delete-orphan")
    folios = relationship("Folio", back_populates="amc", cascade="all, delete-orphan")
    users = relationship("User", back_populates="amc")

    def __repr__(self):
        return f"<AMC(id={self.id}, amc_id={self.amc_id}, name={self.amc_name})>"