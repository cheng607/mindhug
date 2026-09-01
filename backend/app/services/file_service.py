import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.uploaded_file import UploadedFile
from app.schemas.file import UploadResponse

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_upload_response(record: UploadedFile) -> UploadResponse:
    return UploadResponse(
        id=record.id,
        originalName=record.original_name,
        filePath=record.file_path,
        fileSize=record.file_size,
        fileType=record.file_type,
        fileTypeDesc=record.file_type_desc,
        fileExtension=record.file_extension,
        businessType=record.business_type,
        businessTypeDesc=record.business_type_desc,
        businessId=record.business_id,
        businessField=record.business_field,
        status=record.status,
        isTemp=record.is_temp,
        isExpired=record.is_expired,
        createTime=_to_iso(record.created_at),
    )


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_upload(
        self,
        file: UploadFile,
        business_type: str,
        business_id: str,
        business_field: str,
    ) -> UploadedFile:
        content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
        if content_type and content_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError("仅支持上传图片文件")

        original_name = file.filename or "upload.bin"
        extension = Path(original_name).suffix.lower() or ".bin"
        stored_name = f"{uuid.uuid4().hex}{extension}"
        stored_path = self.upload_dir / stored_name

        data = file.file.read()
        if len(data) > settings.MAX_UPLOAD_SIZE:
            raise ValueError(f"文件大小不能超过 {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB")

        stored_path.write_bytes(data)

        file_type = "image" if content_type.startswith("image/") else "other"
        record = UploadedFile(
            original_name=original_name,
            file_path=f"/uploads/{stored_name}",
            file_size=len(data),
            file_type=file_type,
            file_extension=extension.lstrip("."),
            business_type=business_type,
            business_id=business_id,
            business_field=business_field,
            status=1,
            is_temp=True,
            is_expired=False,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
