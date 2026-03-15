import type { articleData, articleParamsType, categoryType } from "../types/konwledgeType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

export const getCategory = async (): Promise<ApiResponse<categoryType[]>> => {
    return request.get('/knowledge/category/tree')
}

export const getArticle = (articleParams: articleParamsType): Promise<ApiResponse<articleData>> => {
    console.log(articleParams)
    return request.get('/knowledge/article/page', articleParams)
}