from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date
from typing import List
from app.db.session import get_db
from app.models.scheme import Scheme
from app.models.admin import BatchJob, BatchJobType, BatchJobStatus
from app.core.jwt import get_current_user
from app.models.user import User
import csv
import io

router = APIRouter(prefix="/admin/nav", tags=["admin"])


@router.post("/upload")
async def upload_nav_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload NAV file (CSV or Excel) and update scheme NAVs"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(
            status_code=400,
            detail="File must be CSV or Excel format"
        )
    
    # Create batch job record
    batch_job = BatchJob(
        job_id=f"NAV{datetime.now().strftime('%Y%m%d%H%M%S')}",
        job_type=BatchJobType.nav_upload,
        job_name=f"NAV Upload - {file.filename}",
        scheduled_at=datetime.now(),
        started_at=datetime.now(),
        status=BatchJobStatus.running,
        executed_by=current_user.email
    )
    db.add(batch_job)
    db.flush()
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse CSV
        if file.filename.endswith('.csv'):
            csv_content = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_content))
            
            records_processed = 0
            records_successful = 0
            records_failed = 0
            errors = []
            
            for row in reader:
                records_processed += 1
                try:
                    scheme_id = row.get('Scheme_ID', '').strip()
                    nav_value = float(row.get('NAV', 0))
                    nav_date_str = row.get('NAV_Date', '').strip()
                    
                    # Validate
                    if not scheme_id:
                        raise ValueError("Scheme_ID is required")
                    if nav_value <= 0:
                        raise ValueError("NAV must be positive")
                    
                    # Parse date
                    try:
                        nav_date = datetime.strptime(nav_date_str, '%Y-%m-%d').date()
                    except ValueError:
                        raise ValueError(f"Invalid date format: {nav_date_str}. Expected YYYY-MM-DD")
                    
                    # Update scheme NAV
                    scheme = db.query(Scheme).filter(
                        Scheme.scheme_id == scheme_id
                    ).first()
                    
                    if not scheme:
                        raise ValueError(f"Scheme {scheme_id} not found")
                    
                    scheme.current_nav = nav_value
                    scheme.nav_date = nav_date
                    
                    records_successful += 1
                except Exception as e:
                    records_failed += 1
                    errors.append(f"Row {records_processed}: {str(e)}")
            
            # Update batch job
            batch_job.records_processed = records_processed
            batch_job.records_successful = records_successful
            batch_job.records_failed = records_failed
            batch_job.error_log = "\n".join(errors) if errors else None
            batch_job.status = BatchJobStatus.completed if records_failed == 0 else BatchJobStatus.failed
            batch_job.completed_at = datetime.now()
            
            db.commit()
            
            return {
                "message": "NAV upload completed",
                "job_id": batch_job.job_id,
                "records_processed": records_processed,
                "records_successful": records_successful,
                "records_failed": records_failed,
                "errors": errors[:10]  # First 10 errors
            }
            
        else:
            raise HTTPException(
                status_code=400,
                detail="Excel file support coming soon. Please use CSV format."
            )
            
    except Exception as e:
        batch_job.status = BatchJobStatus.failed
        batch_job.error_log = str(e)
        batch_job.completed_at = datetime.now()
        db.commit()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/history")
async def get_nav_upload_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get NAV upload history"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    uploads = db.query(BatchJob).filter(
        BatchJob.job_type == BatchJobType.nav_upload
    ).order_by(BatchJob.created_at.desc()).limit(limit).all()
    
    upload_list = []
    for upload in uploads:
        upload_list.append({
            "job_id": upload.job_id,
            "filename": upload.job_name.replace("NAV Upload - ", ""),
            "status": upload.status.value,
            "uploaded_at": upload.started_at.isoformat() if upload.started_at else None,
            "records_processed": upload.records_processed,
            "records_successful": upload.records_successful,
            "records_failed": upload.records_failed
        })
    
    return {"uploads": upload_list}


