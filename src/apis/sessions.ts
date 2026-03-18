import type { sessionData, sessionDetailType, sessionParamType } from "../types/sessionsType"
import type { ApiResponse } from "../types/userType"
import { request } from "../utils/request"

// 获取会话列表
export const getSessions = (params: sessionParamType): Promise<ApiResponse<sessionData>> => {
    return request.get('/psychological-chat/sessions', params)
}

// 获取会话详情
export const getSessionDetail = (sessionId: string): Promise<ApiResponse<sessionDetailType[]>> => {
    return request.get(`/psychological-chat/sessions/${sessionId}/messages`)
}