from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.services.file_service import FileService, build_upload_response

router = APIRouter(prefix="/file", tags=["file"])


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    businessType: str = Form("ARTICLE"),
    businessId: str = Form(""),
    businessField: str = Form("cover"),
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FileService(db)
    try:
        record = service.save_upload(
            file=file,
            business_type=businessType,
            business_id=businessId,
            business_field=businessField,
        )
    except ValueError as exc:
        return error_response("400", str(exc), status_code=400)
    return success_response(data=build_upload_response(record).model_dump(), msg="上传成功")
