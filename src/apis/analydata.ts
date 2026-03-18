import type { analyticsDataType } from "../types/analyType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

export const getAnalysis = async (): Promise<ApiResponse<analyticsDataType>> => {
    return request.get('/data-analytics/overview')
}