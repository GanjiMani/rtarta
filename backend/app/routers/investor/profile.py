from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.session import get_db
from app.services.investor_service import InvestorService
from app.schemas.investor import (
    BankAccountCreate, BankAccountUpdate, NomineeCreate, NomineeUpdate,
    InvestorUpdate, KYCUpdate
)
from app.core.jwt import get_current_investor
from app.models.user import User
from app.models.document import Document, DocumentType, DocumentStatus
from app.core.config import settings
import logging
import os
import hashlib
import shutil
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_investor_profile(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get complete investor profile"""
    try:
        # Check if user has investor_id
        if not current_user.investor_id:
            raise ValueError("User does not have an associated investor profile")

        investor_service = InvestorService(db)
        profile = investor_service.get_investor_profile(current_user.investor_id)

        return {
            "message": "Profile retrieved successfully",
            "data": profile
        }

    except ValueError as e:
        logger.warning(f"Profile not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Get profile error: {e}", exc_info=True)
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        # Return a generic error message, not the internal error details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile. Please try again later."
        )


@router.put("/")
async def update_investor_profile(
    update_data: InvestorUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update investor profile information"""
    try:
        investor_service = InvestorService(db)
        updated_investor = investor_service.update_investor_profile(
            current_user.investor_id,
            update_data.dict(exclude_unset=True)
        )

        # Ensure changes are committed
        db.commit()
        db.refresh(updated_investor)

        return {
            "message": "Profile updated successfully",
            "data": {
                "investor": updated_investor
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Update profile error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.put("/kyc")
async def update_kyc(
    kyc_data: KYCUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update KYC information"""
    try:
        investor_service = InvestorService(db)
        # Note: In production, KYC updates should require document verification
        updated_investor = investor_service.update_investor_profile(
            current_user.investor_id,
            kyc_data.dict(exclude_unset=True)
        )
        
        # Commit changes to database
        db.commit()
        db.refresh(updated_investor)

        return {
            "message": "KYC information updated successfully",
            "data": {
                "investor": updated_investor
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"KYC update error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update KYC information"
        )


@router.post("/bank-accounts")
async def add_bank_account(
    bank_data: BankAccountCreate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Add new bank account"""
    try:
        investor_service = InvestorService(db)
        bank_account = investor_service.add_bank_account(current_user.investor_id, bank_data)
        
        # Commit changes to database
        db.commit()
        db.refresh(bank_account)

        return {
            "message": "Bank account added successfully",
            "data": {
                "bank_account": bank_account
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Add bank account error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add bank account"
        )


@router.put("/bank-accounts/{account_id}")
async def update_bank_account(
    account_id: int,
    update_data: BankAccountUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update bank account details"""
    try:
        investor_service = InvestorService(db)
        updated_account = investor_service.update_bank_account(
            current_user.investor_id,
            account_id,
            update_data.dict(exclude_unset=True)
        )
        
        # Commit changes to database
        db.commit()
        db.refresh(updated_account)

        return {
            "message": "Bank account updated successfully",
            "data": {
                "bank_account": updated_account
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Update bank account error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bank account"
        )


@router.put("/bank-accounts/{account_id}/primary")
async def set_primary_bank_account(
    account_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Set bank account as primary"""
    try:
        investor_service = InvestorService(db)
        primary_account = investor_service.set_primary_bank_account(current_user.investor_id, account_id)
        
        # Commit changes to database
        db.commit()
        db.refresh(primary_account)

        return {
            "message": "Primary bank account updated successfully",
            "data": {
                "bank_account": primary_account
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Set primary bank account error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set primary bank account"
        )


@router.put("/bank-accounts/{account_id}/verify")
async def verify_bank_account(
    account_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Verify bank account"""
    try:
        investor_service = InvestorService(db)
        verified_account = investor_service.verify_bank_account(current_user.investor_id, account_id)
        
        # Commit changes to database
        db.commit()
        db.refresh(verified_account)

        return {
            "message": "Bank account verified successfully",
            "data": {
                "bank_account": verified_account
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Verify bank account error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify bank account"
        )


@router.post("/nominees")
async def add_nominee(
    nominee_data: NomineeCreate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Add new nominee"""
    try:
        investor_service = InvestorService(db)
        nominee = investor_service.add_nominee(current_user.investor_id, nominee_data)
        
        # Commit changes to database
        db.commit()
        db.refresh(nominee)

        return {
            "message": "Nominee added successfully",
            "data": {
                "nominee": nominee
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Add nominee error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add nominee"
        )


@router.put("/nominees/{nominee_id}")
async def update_nominee(
    nominee_id: int,
    update_data: NomineeUpdate,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Update nominee details"""
    try:
        investor_service = InvestorService(db)
        updated_nominee = investor_service.update_nominee(
            current_user.investor_id,
            nominee_id,
            update_data.dict(exclude_unset=True)
        )
        
        # Commit changes to database
        db.commit()
        db.refresh(updated_nominee)

        return {
            "message": "Nominee updated successfully",
            "data": {
                "nominee": updated_nominee
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Update nominee error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update nominee"
        )


@router.delete("/nominees/{nominee_id}")
async def delete_nominee(
    nominee_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Delete nominee"""
    try:
        investor_service = InvestorService(db)
        investor_service.delete_nominee(current_user.investor_id, nominee_id)
        
        # Commit changes to database
        db.commit()

        return {
            "message": "Nominee deleted successfully"
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Delete nominee error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete nominee"
        )


@router.get("/dashboard")
async def get_dashboard_data(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get investor dashboard data"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
            
        investor_service = InvestorService(db)
        dashboard_data = investor_service.get_investor_dashboard_data(current_user.investor_id)

        return {
            "message": "Dashboard data retrieved successfully",
            "data": dashboard_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get dashboard error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard data"
        )


@router.get("/documents")
async def get_documents(
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Get all documents for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        documents = db.query(Document).filter(
            Document.investor_id == current_user.investor_id
        ).order_by(Document.created_at.desc()).all()
        
        documents_list = []
        for doc in documents:
            documents_list.append({
                "id": doc.id,
                "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
                "document_name": doc.document_name,
                "name": doc.document_name,  # For frontend compatibility
                "file_size": doc.file_size,
                "mime_type": doc.mime_type,
                "status": doc.status.value if hasattr(doc.status, 'value') else str(doc.status),
                "verified_by": doc.verified_by,
                "verified_at": doc.verified_at.isoformat() if doc.verified_at else None,
                "rejection_reason": doc.rejection_reason,
                "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
                "uploaded_on": doc.created_at.strftime("%Y-%m-%d") if doc.created_at else None,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "updated_at": doc.updated_at.isoformat() if doc.updated_at else None
            })
        
        return {
            "message": "Documents retrieved successfully",
            "data": documents_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get documents error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve documents"
        )


@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Upload a document for the investor"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        # Validate document type (accept both enum name and value)
        doc_type = None
        for dt in DocumentType:
            if dt.name == document_type or dt.value == document_type:
                doc_type = dt
                break
        
        if doc_type is None:
            allowed_types = [f"{dt.name} ({dt.value})" for dt in DocumentType]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document type. Allowed types: {', '.join([dt.name for dt in DocumentType])}"
            )
        
        # Validate file size (10MB max)
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
            )
        
        # Validate file type
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Create upload directory if it doesn't exist
        upload_dir = Path(settings.UPLOAD_DIRECTORY) / current_user.investor_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{doc_type.value}_{timestamp}{file_extension}"
        file_path = upload_dir / safe_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Calculate checksum
        checksum = hashlib.sha256(file_content).hexdigest()
        
        # Get MIME type
        mime_type = file.content_type or "application/octet-stream"
        
        # Create document record
        document = Document(
            investor_id=current_user.investor_id,
            document_type=doc_type,
            document_name=file.filename,
            file_path=str(file_path),
            file_size=file_size,
            mime_type=mime_type,
            status=DocumentStatus.pending,
            checksum=checksum,
            upload_ip="0.0.0.0"  # In production, get from request
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "message": "Document uploaded successfully",
            "data": {
                "id": document.id,
                "document_type": document.document_type.value,
                "document_name": document.document_name,
                "name": document.document_name,
                "file_size": document.file_size,
                "status": document.status.value,
                "uploaded_on": document.created_at.strftime("%Y-%m-%d") if document.created_at else None
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Upload document error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Download a document"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.investor_id == current_user.investor_id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        file_path = Path(document.file_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found"
            )
        
        return FileResponse(
            path=str(file_path),
            filename=document.document_name,
            media_type=document.mime_type or "application/octet-stream"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download document error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download document"
        )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_investor),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    try:
        if not current_user.investor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have an associated investor profile"
            )
        
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.investor_id == current_user.investor_id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete file from filesystem
        file_path = Path(document.file_path)
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {e}")
        
        # Delete document record
        db.delete(document)
        db.commit()
        
        return {
            "message": "Document deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete document error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )