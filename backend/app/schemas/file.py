from pydantic import BaseModel


class UploadResponse(BaseModel):
    id: int
    originalName: str
    filePath: str
    fileSize: int
    fileType: str
    fileTypeDesc: str
    fileExtension: str
    businessType: str
    businessTypeDesc: str
    businessId: str
    businessField: str
    status: int
    isTemp: bool
    isExpired: bool
    createTime: str
