import type { diaryData, diaryFormData, diaryParamType } from "../types/emotionType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

export const getMyDiaries = (params: { currentPage?: string; size?: string }): Promise<ApiResponse<diaryData>> => {
    return request.get('/emotion-diary/my/page', params)
}

export const getDiary = (params: diaryParamType): Promise<ApiResponse<diaryData>> => {
    return request.get('/emotion-diary/admin/page', params)
}
export const deleteDiary = (id: string): Promise<ApiResponse> => {
    return request.delete(`/emotion-diary/admin/${id}`)
}

export const addDiary = (data: diaryFormData): Promise<ApiResponse> => {
    return request.post('/emotion-diary', data)
}