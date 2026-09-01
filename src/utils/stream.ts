/** 生成唯一消息 ID */
export const generateUniqueId = () =>
    Math.floor(Math.random() * 1000000000) + Date.now()

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
