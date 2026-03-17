import type { addArticleType, articleData, articleParamsType, categoryType } from "../types/articleType"
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