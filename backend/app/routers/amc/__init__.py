from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def amc_home():
    return {"message": "AMC endpoints"}






