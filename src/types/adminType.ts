export interface CitationType {
    articleId: string
    title: string
    snippet: string
    score?: number
}

export interface RiskAlertType {
    id: number
    userId: number
    userNickname: string
    sessionId: number | null
    riskLevel: number
    triggerReason: string
    userMessage: string
    status: string
    statusText: string
    adminNote: string
    resolvedAt: string
    createdAt: string
    updatedAt: string
}

export interface RiskAlertPageType {
    records: RiskAlertType[]
    total: number
    size: number
    current: number
    pages: number
}

export interface AgentPromptConfigType {
    id: number
    agentKey: string
    agentName: string
    systemPrompt: string
    model: string
    temperature: number
    maxTokens: number
    isActive: number
}
