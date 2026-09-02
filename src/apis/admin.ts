import type { ApiResponse } from '../types/userType'
import type { AgentPromptConfigType, RiskAlertPageType, RiskAlertType } from '../types/adminType'
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
