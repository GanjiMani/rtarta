from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def sebi_home():
    return {"message": "SEBI endpoints"}





