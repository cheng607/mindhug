import type { addArticleType, articleData, articleParamsType, articleType, categoryType } from "../types/articleType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"
// 获取文章分类
export const getCategory = async (): Promise<ApiResponse<categoryType[]>> => {
    return request.get('/knowledge/category/tree')
}
// 获取文章列表
export const getArticle = (articleParams: articleParamsType): Promise<ApiResponse<articleData>> => {
    return request.get('/knowledge/article/page', articleParams)
}

// 新增文章
export const addArticle = (params: addArticleType): Promise<ApiResponse> => {
    console.log('参数', params)
    return request.post('/knowledge/article', params)
}

// 获取单篇文章
export const getArticleById = (id: string): Promise<ApiResponse<articleType>> => {
    return request.get(`/knowledge/article/${id}`)
}

// 更新文章状态
export const updateArticleStatus = (id: string, status: number): Promise<ApiResponse> => {
    return request.put(`/knowledge/article/${id}/status`, { status })
}
// 更新文章
export const updateArticle = (id: string, params: addArticleType): Promise<ApiResponse> => {
    return request.put(`/knowledge/article/${id}`, params)
}

// 删除文章
export const deleteArticle = (id: string): Promise<ApiResponse> => {
    return request.delete(`/knowledge/article/${id}`)
}