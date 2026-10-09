from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/hardware",
    tags=["Hardware"]
)


class CardScanRequest(BaseModel):
    device_id: str
    card_uid: str


@router.post("/scan")
def receive_card_scan(data: CardScanRequest):

    return {
        "success": True,
        "message": "Card scan received",
        "device_id": data.device_id,
        "card_uid": data.card_uid
    }