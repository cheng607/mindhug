export interface categoryType {
    articleCount: number,
    categoryName: string,
    createdAt: string,
    description: string,
    id: number,
    sortOrder: number,
    status: number,
    statusText: string,
    updatedAt: string
}

export interface articleParamsType {
    title: string,
    categoryId: string,
    status: string,
    authorName: string,
    currentPage: string,
    size: string,
}

export interface articleType {
    id: string,
    categoryId: number,
    categoryName: string,
    title: string,
    summary: string,
    coverImage: string,
    tags: string,
    authorName: string,
    readCount: number,
    status: number,
    statusText: string,
    isFavorited: false,
    favoriteCount: number,
    publishedAt: string,
    createdAt: string,
    updatedAt: string,
    content?: string
}
export interface articleData {
    current: number,
    pages: number,
    records: articleType[],
    size: number,
    total: number
}

export interface addArticleType {
    categoryId: number;
    content: string;
    coverImage: string;
    id: string;
    summary: string;
    tags: string;
    title: string;
}