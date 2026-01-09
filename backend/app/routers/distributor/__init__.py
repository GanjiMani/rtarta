from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def distributor_home():
    return {"message": "Distributor endpoints"}





