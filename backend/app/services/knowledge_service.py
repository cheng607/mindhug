import math
from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.models.knowledge_article import STATUS_DRAFT, STATUS_PUBLISHED, KnowledgeArticle
from app.models.knowledge_category import KnowledgeCategory
from app.models.user import User
from app.schemas.knowledge import (
    ArticleCreateRequest,
    ArticlePageResponse,
    ArticleResponse,
    CategoryResponse,
)


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_category_response(category: KnowledgeCategory) -> CategoryResponse:
    article_count = (
        len([item for item in category.articles if item.status == STATUS_PUBLISHED])
        if category.articles
        else 0
    )
    return CategoryResponse(
        id=category.id,
        categoryName=category.category_name,
        description=category.description,
        sortOrder=category.sort_order,
        status=category.status,
        statusText=category.status_text,
        articleCount=article_count,
        createdAt=_to_iso(category.created_at),
        updatedAt=_to_iso(category.updated_at),
    )


def build_article_response(article: KnowledgeArticle, include_content: bool = False) -> ArticleResponse:
    return ArticleResponse(
        id=str(article.id),
        categoryId=article.category_id,
        categoryName=article.category_name,
        title=article.title,
        summary=article.summary,
        coverImage=article.cover_image,
        tags=article.tags,
        authorName=article.author_name,
        readCount=article.read_count,
        status=article.status,
        statusText=article.status_text,
        isFavorited=False,
        favoriteCount=0,
        publishedAt=_to_iso(article.published_at),
        createdAt=_to_iso(article.created_at),
        updatedAt=_to_iso(article.updated_at),
        content=article.content if include_content else None,
    )


class KnowledgeService:
    def __init__(self, db: Session):
        self.db = db

    def list_categories(self) -> list[CategoryResponse]:
        categories = (
            self.db.query(KnowledgeCategory)
            .options(joinedload(KnowledgeCategory.articles))
            .filter(KnowledgeCategory.status == 1)
            .order_by(KnowledgeCategory.sort_order.asc(), KnowledgeCategory.id.asc())
            .all()
        )
        return [build_category_response(item) for item in categories]

    def list_articles(
        self,
        page_num: int = 1,
        page_size: int = 10,
        title: str = "",
        category_id: str = "",
        status: str = "",
        author_name: str = "",
        sort_field: str = "publishedAt",
        sort_direction: str = "desc",
        published_only: bool = False,
    ) -> ArticlePageResponse:
        query = (
            self.db.query(KnowledgeArticle)
            .options(joinedload(KnowledgeArticle.category))
        )

        if published_only:
            query = query.filter(KnowledgeArticle.status == STATUS_PUBLISHED)
        elif status != "":
            try:
                query = query.filter(KnowledgeArticle.status == int(status))
            except ValueError:
                pass

        if title:
            query = query.filter(KnowledgeArticle.title.ilike(f"%{title}%"))
        if category_id:
            try:
                query = query.filter(KnowledgeArticle.category_id == int(category_id))
            except ValueError:
                pass
        if author_name:
            query = query.filter(KnowledgeArticle.author_name.ilike(f"%{author_name}%"))

        sort_map = {
            "publishedAt": KnowledgeArticle.published_at,
            "readCount": KnowledgeArticle.read_count,
            "createdAt": KnowledgeArticle.created_at,
            "updatedAt": KnowledgeArticle.updated_at,
        }
        sort_column = sort_map.get(sort_field, KnowledgeArticle.published_at)
        if sort_direction.lower() == "asc":
            query = query.order_by(sort_column.asc().nullslast(), KnowledgeArticle.id.asc())
        else:
            query = query.order_by(desc(sort_column), desc(KnowledgeArticle.id))

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        articles = query.offset(offset).limit(page_size).all()
        records = [build_article_response(item) for item in articles]
        return ArticlePageResponse(
            records=records,
            total=total,
            size=page_size,
            current=current,
            pages=pages,
        )

    def get_article(self, article_id: int, increment_read: bool = False) -> KnowledgeArticle:
        article = (
            self.db.query(KnowledgeArticle)
            .options(joinedload(KnowledgeArticle.category))
            .filter(KnowledgeArticle.id == article_id)
            .first()
        )
        if not article:
            raise ValueError("文章不存在")
        if increment_read:
            article.read_count += 1
            self.db.commit()
            self.db.refresh(article)
        return article

    def create_article(self, user: User, payload: ArticleCreateRequest) -> KnowledgeArticle:
        now = datetime.now(timezone.utc)
        article = KnowledgeArticle(
            category_id=payload.categoryId,
            title=payload.title.strip(),
            summary=payload.summary or "",
            content=payload.content,
            cover_image=payload.coverImage or "",
            tags=payload.tags if isinstance(payload.tags, str) else ",".join(payload.tags),
            author_name=user.display_name,
            author_id=user.id,
            status=STATUS_DRAFT,
            published_at=None,
        )
        self.db.add(article)
        self.db.commit()
        self.db.refresh(article)
        return article

    def update_article(self, article_id: int, payload: ArticleCreateRequest) -> KnowledgeArticle:
        article = self.get_article(article_id)
        article.category_id = payload.categoryId
        article.title = payload.title.strip()
        article.summary = payload.summary or ""
        article.content = payload.content
        article.cover_image = payload.coverImage or ""
        article.tags = payload.tags if isinstance(payload.tags, str) else ",".join(payload.tags)
        self.db.commit()
        self.db.refresh(article)
        return article

    def update_article_status(self, article_id: int, status: int) -> KnowledgeArticle:
        article = self.get_article(article_id)
        article.status = status
        if status == STATUS_PUBLISHED and not article.published_at:
            article.published_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(article)
        return article

    def delete_article(self, article_id: int) -> None:
        article = self.get_article(article_id)
        self.db.delete(article)
        self.db.commit()
