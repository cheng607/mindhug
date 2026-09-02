import type { ApiResponse } from '../types/userType'
import type { AgentPromptConfigType, RiskAlertPageType, RiskAlertType, AgentLogPageType } from '../types/adminType'
import { request } from '../utils/request'

export const getRiskAlerts = (params: {
    pageNum?: string
    pageSize?: string
    status?: string
    riskLevel?: string
}): Promise<ApiResponse<RiskAlertPageType>> => {
    return request.get('/admin/risk-alerts', params)
}

export const getPendingAlertCount = (): Promise<ApiResponse<{ count: number }>> => {
    return request.get('/admin/risk-alerts/pending-count')
}

export const updateRiskAlert = (
    alertId: number,
    data: { status?: string; adminNote?: string }
): Promise<ApiResponse<RiskAlertType>> => {
    return request.put(`/admin/risk-alerts/${alertId}`, data)
}

export const getAgentConfigs = (): Promise<ApiResponse<AgentPromptConfigType[]>> => {
    return request.get('/admin/agent-config')
}

export const updateAgentConfig = (
    agentKey: string,
    data: Partial<Pick<AgentPromptConfigType, 'systemPrompt' | 'model' | 'temperature' | 'maxTokens' | 'isActive'>>
): Promise<ApiResponse<AgentPromptConfigType>> => {
    return request.put(`/admin/agent-config/${agentKey}`, data)
}

export const reindexKnowledge = (): Promise<ApiResponse<{ chunkCount: number }>> => {
    return request.post('/admin/rag/reindex')
}

export const getAdminSessions = (params: {
    currentPage?: string
    size?: string
    emotionTag?: string
    userId?: string
}): Promise<ApiResponse<import('../types/sessionsType').sessionData>> => {
    return request.get('/admin/sessions', params)
}

export const getAdminSessionMessages = (
    sessionId: string
): Promise<ApiResponse<import('../types/sessionsType').sessionDetailType[]>> => {
    return request.get(`/admin/sessions/${sessionId}/messages`)
}

export const getAgentLogs = (params: {
    pageNum?: string
    pageSize?: string
    intent?: string
    userId?: string
}): Promise<ApiResponse<AgentLogPageType>> => {
    return request.get('/admin/agent-logs', params)
}
