from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import success_response
from app.models.user import User
from app.services.rag_service import RAGService

router = APIRouter(prefix="/admin/rag", tags=["admin-rag"])


@router.post("/reindex")
async def reindex_knowledge(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = RAGService(db)
    total = await service.index_all_published()
    return success_response(data={"chunkCount": total}, msg="知识库索引完成")
