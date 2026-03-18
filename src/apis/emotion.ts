import type { diaryData, diaryParamType } from "../types/emotionType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

export const getDiary = (params: diaryParamType): Promise<ApiResponse<diaryData>> => {
    return request.get('/emotion-diary/admin/page', params)
}
export const deleteDiary = (id: string): Promise<ApiResponse> => {
    return request.delete(`/emotion-diary/admin/${id}`)
}