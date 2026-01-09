from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.admin import BatchJob, BatchJobType, BatchJobStatus
from app.core.jwt import get_current_user
from app.models.user import User

router = APIRouter(prefix="/admin/batch-jobs", tags=["admin"])


@router.get("/")
async def get_batch_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get batch jobs"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(BatchJob)
    
    if job_type:
        try:
            bj_type = BatchJobType[job_type]
            query = query.filter(BatchJob.job_type == bj_type)
        except KeyError:
            pass
    
    if status:
        try:
            bj_status = BatchJobStatus[status]
            query = query.filter(BatchJob.status == bj_status)
        except KeyError:
            pass
    
    total = query.count()
    
    jobs = query.order_by(desc(BatchJob.scheduled_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    job_list = []
    for job in jobs:
        job_list.append({
            "job_id": job.job_id,
            "job_type": job.job_type.value,
            "job_name": job.job_name,
            "status": job.status.value,
            "scheduled_at": job.scheduled_at.isoformat() if job.scheduled_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "records_processed": job.records_processed,
            "records_successful": job.records_successful,
            "records_failed": job.records_failed,
            "execution_time_seconds": job.execution_time_seconds,
            "executed_by": job.executed_by
        })
    
    return {
        "batch_jobs": job_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{job_id}")
async def get_batch_job_details(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get batch job details"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    job = db.query(BatchJob).filter(
        BatchJob.job_id == job_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")
    
    return {
        "job": {
            "job_id": job.job_id,
            "job_type": job.job_type.value,
            "job_name": job.job_name,
            "status": job.status.value,
            "parameters": job.parameters,
            "scheduled_at": job.scheduled_at.isoformat() if job.scheduled_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "records_processed": job.records_processed,
            "records_successful": job.records_successful,
            "records_failed": job.records_failed,
            "error_log": job.error_log,
            "execution_time_seconds": job.execution_time_seconds,
            "executed_by": job.executed_by,
            "input_file_path": job.input_file_path,
            "output_file_path": job.output_file_path
        }
    }


@router.post("/{job_id}/cancel")
async def cancel_batch_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a running batch job"""
    
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    job = db.query(BatchJob).filter(
        BatchJob.job_id == job_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")
    
    if job.status != BatchJobStatus.running:
        raise HTTPException(status_code=400, detail="Only running jobs can be cancelled")
    
    job.status = BatchJobStatus.cancelled
    job.completed_at = datetime.now()
    
    db.commit()
    
    return {
        "message": "Batch job cancelled successfully",
        "job_id": job_id
    }


