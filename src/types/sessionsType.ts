export interface sessionParamType {
    currentPage: string,
    size: string,
    emotionTag: string
}
export interface sessionType {
    durationMinutes: number
    id: number
    lastMessageContent: string
    lastMessageTime: string
    messageCount: number
    sessionTitle: string
    startedAt: string
    userId: number
    userNickname: string
    emotionTag?: string
}

export interface sessionData {
    current: number,
    pages: number,
    records: sessionType[],
    size: number,
    total: number
}

export interface sessionDetailType {
    content: string,
    contentLength: number,
    contentPreview: string,
    createdAt: string,
    id: number,
    messageType: number,
    messageTypeDesc: string,
    senderType: number,
    senderTypeDesc: string,
    sessionId: number,
    citations?: CitationType[]
}

export interface CitationType {
    articleId: string
    title: string
    snippet: string
    score?: number
}

export interface newChatParam {
    sessionId?: string,
    status?: string,
    initialMessage?: string,
    sessionTitle?: string
}

export interface newChatResponseType {
    expiryTime: number
    initialMessage: string
    messageCount: number
    sessionId: string
    startTime: number
    status: string
    userHash: number
}
export interface sessionItemType {
    durationMinutes: number
    id: number
    lastMessageTime: string
    lastMessageContent: string
    messageCount: number
    sessionTitle: string
    startedAt: string
    userId: number
    userNickname: string
}

export interface sessionListType {
    current: number
    pages: number
    records: sessionItemType[]
    size: number
    total: number
}
export interface emotionAnalysType {
    primaryEmotion: string
    emotionScore: number
    isNegative: boolean
    riskLevel: number
    keywords: string[]
    suggestion: string
    icon: string
    label: string
    riskDescription: string
    improvementSuggestions: string[]
    timestamp: number
}