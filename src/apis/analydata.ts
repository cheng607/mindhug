import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

export const getAnalysis = async (): Promise<ApiResponse> => {
    return request.get('/data-analytics/overview')
}