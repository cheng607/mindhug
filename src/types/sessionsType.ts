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
    sessionId: number
}