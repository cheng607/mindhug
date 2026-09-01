import type { emotionAnalysType, newChatParam, newChatResponseType, sessionData, sessionDetailType, sessionListType, sessionParamType } from "../types/sessionsType"
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

// 创建新的会话
export const createChat = (params: newChatParam): Promise<ApiResponse<newChatResponseType>> => {
    return request.post('/psychological-chat/session/start', params)
}

// 分页查询咨询会话
export const getSessionsByPage = (params: { pageNum: string, pageSize: string }): Promise<ApiResponse<sessionListType>> => {
    return request.get('/psychological-chat/sessions', params)
}

// 删除会话
export const deleteSession = (sessionId: string): Promise<ApiResponse<null>> => {
    return request.delete(`/psychological-chat/sessions/${sessionId}`)
}

// 流式对话接口（Consultation 组件直接使用 fetchEventSource，此处保留供其他场景）
export const streamChat = (params: { sessionId: string, userMessage: string }): Promise<ApiResponse> => {
    return request.post('/psychological-chat/stream', params)
}

// 获取分析结果
export const getAnalysisResult = (sessionId: string): Promise<ApiResponse<emotionAnalysType>> => {
    return request.get(`/psychological-chat/session/${sessionId}/emotion`)
}