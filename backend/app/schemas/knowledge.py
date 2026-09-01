from pydantic import BaseModel, Field, field_validator


class CategoryResponse(BaseModel):
    id: int
    categoryName: str
    description: str
    sortOrder: int
    status: int
    statusText: str
    articleCount: int
    createdAt: str
    updatedAt: str


class ArticleCreateRequest(BaseModel):
    categoryId: int
    title: str = Field(..., min_length=1)
    summary: str = ""
    content: str = Field(..., min_length=1)
    coverImage: str = ""
    tags: str | list[str] = ""
    id: str | None = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value):
        if value is None:
            return ""
        if isinstance(value, list):
            return ",".join(str(item) for item in value if item)
        return str(value)


class ArticleUpdateRequest(ArticleCreateRequest):
    pass


class ArticleStatusRequest(BaseModel):
    status: int


class ArticleResponse(BaseModel):
    id: str
    categoryId: int
    categoryName: str
    title: str
    summary: str
    coverImage: str
    tags: str
    authorName: str
    readCount: int
    status: int
    statusText: str
    isFavorited: bool = False
    favoriteCount: int = 0
    publishedAt: str
    createdAt: str
    updatedAt: str
    content: str | None = None


class ArticlePageResponse(BaseModel):
    records: list[ArticleResponse]
    total: int
    size: int
    current: int
    pages: int
