from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user, get_optional_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.knowledge import ArticleCreateRequest, ArticleStatusRequest, ArticleUpdateRequest
from app.services.knowledge_service import KnowledgeService, build_article_response

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


@router.get("/category/tree")
def list_categories(
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    categories = service.list_categories()
    return success_response(data=[item.model_dump() for item in categories], msg="查询成功")


@router.get("/article/page")
def list_articles(
    currentPage: str | None = Query("1"),
    size: str | None = Query("10"),
    title: str | None = Query(""),
    categoryId: str | None = Query(""),
    status: str | None = Query(""),
    authorName: str | None = Query(""),
    sortField: str | None = Query("publishedAt"),
    sortDirection: str | None = Query("desc"),
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    is_admin = current_user is not None and current_user.user_type == 2
    data = service.list_articles(
        page_num=_parse_page(currentPage, 1),
        page_size=_parse_page(size, 10),
        title=title or "",
        category_id=categoryId or "",
        status=status or "",
        author_name=authorName or "",
        sort_field=sortField or "publishedAt",
        sort_direction=sortDirection or "desc",
        published_only=not is_admin,
    )
    return success_response(data=data.model_dump(), msg="查询成功")


@router.post("/article")
def create_article(
    payload: ArticleCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    article = service.create_article(current_user, payload)
    return success_response(
        data=build_article_response(article, include_content=True).model_dump(),
        msg="创建成功",
    )


@router.get("/article/{article_id}")
def get_article(
    article_id: int,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        is_admin = current_user is not None and current_user.user_type == 2
        article = service.get_article(article_id, increment_read=not is_admin)
        if not is_admin and article.status != 1:
            return error_response("404", "文章不存在", status_code=404)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(
        data=build_article_response(article, include_content=True).model_dump(),
        msg="查询成功",
    )


@router.put("/article/{article_id}")
def update_article(
    article_id: int,
    payload: ArticleUpdateRequest,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        article = service.update_article(article_id, payload)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(
        data=build_article_response(article, include_content=True).model_dump(),
        msg="更新成功",
    )


@router.put("/article/{article_id}/status")
def update_article_status(
    article_id: int,
    payload: ArticleStatusRequest,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        article = service.update_article_status(article_id, payload.status)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(
        data=build_article_response(article).model_dump(),
        msg="状态更新成功",
    )


@router.delete("/article/{article_id}")
def delete_article(
    article_id: int,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        service.delete_article(article_id)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=None, msg="删除成功")
