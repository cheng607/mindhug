let messageSeq = 0

/** 生成单调递增的消息 ID，保证同会话内顺序稳定 */
export const generateUniqueId = () => {
    messageSeq = (messageSeq + 1) % 1000
    return Date.now() * 1000 + messageSeq
}

/** 合并流式分片，兼容增量、累计和重叠片段，避免内容重复 */
export const mergeStreamChunk = (existing: string, incoming: string) => {
    if (!incoming) return existing
    if (!existing) return incoming

    if (incoming.startsWith(existing)) return incoming
    if (existing.endsWith(incoming)) return existing

    const maxOverlap = Math.min(existing.length, incoming.length)
    for (let overlap = maxOverlap; overlap > 0; overlap--) {
        const suffix = existing.slice(-overlap)
        const prefix = incoming.slice(0, overlap)
        if (suffix === prefix) {
            return existing + incoming.slice(overlap)
        }
    }

    return existing + incoming
}
