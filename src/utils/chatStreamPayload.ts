import type { sessionDetailType, CitationType } from '../types/sessionsType'
import { mergeStreamChunk } from './stream'

export interface StreamPayloadResult {
    ok: boolean
    crisis?: boolean
    agentName?: string
}

/** 解析 SSE payload 并更新聊天列表（纯函数，便于单元测试） */
export function applyStreamPayload(
    payload: Record<string, unknown>,
    prev: sessionDetailType[],
    onCrisisDetected?: () => void,
): { next: sessionDetailType[]; result: StreamPayloadResult } {
    if (payload.error) {
        const newList = [...prev]
        const last = newList[newList.length - 1]
        if (last?.senderType === 2 && !last.content?.trim()) {
            newList.pop()
        }
        return { next: newList, result: { ok: false } }
    }

    let next = prev
    const result: StreamPayloadResult = { ok: true }

    if (payload.agent === 'crisis') {
        result.crisis = true
        onCrisisDetected?.()
    }
    if (payload.agentName) {
        result.agentName = String(payload.agentName)
    }

    if (Array.isArray(payload.citations) && payload.citations.length > 0) {
        next = [...next]
        const lastIndex = next.length - 1
        const lastMessage = next[lastIndex]
        if (lastMessage && lastMessage.senderType === 2) {
            next[lastIndex] = {
                ...lastMessage,
                citations: payload.citations as CitationType[],
            }
        }
    }

    const chunk = payload.content ?? (payload.data as { content?: string } | undefined)?.content
    if (typeof chunk === 'string' && chunk.length > 0) {
        next = [...next]
        const lastIndex = next.length - 1
        const lastMessage = next[lastIndex]
        if (lastMessage && lastMessage.senderType === 2) {
            const existing = lastMessage.content || ''
            const updated = mergeStreamChunk(existing, chunk)
            next[lastIndex] = {
                ...lastMessage,
                content: updated,
                contentLength: updated.length,
                contentPreview: updated.substring(0, 50),
            }
        }
    }

    return { next, result }
}
