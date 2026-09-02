import { describe, expect, it, vi } from 'vitest'
import { applyStreamPayload } from './chatStreamPayload'
import type { sessionDetailType } from '../types/sessionsType'

const aiMessage = (content = ''): sessionDetailType => ({
    id: 1001,
    content,
    senderType: 2,
    senderTypeDesc: 'AI助手',
    messageType: 1,
    messageTypeDesc: '文本',
    contentLength: content.length,
    contentPreview: content.substring(0, 50),
    createdAt: '2026-01-01T00:00:00.000Z',
    sessionId: 1,
})

describe('applyStreamPayload', () => {
    it('appends stream content to last AI message', () => {
        const prev = [aiMessage('你')]
        const { next } = applyStreamPayload({ content: '好' }, prev)
        expect(next[0].content).toBe('你好')
    })

    it('merges cumulative stream chunks without duplication', () => {
        const prev = [aiMessage('你好')]
        const { next } = applyStreamPayload({ content: '你好世界' }, prev)
        expect(next[0].content).toBe('你好世界')
    })

    it('sets citations on last AI message', () => {
        const prev = [aiMessage('回答')]
        const citations = [{ articleId: '1', title: '测试文章', snippet: '摘要' }]
        const { next } = applyStreamPayload({ citations }, prev)
        expect(next[0].citations).toEqual(citations)
    })

    it('invokes crisis callback and records agent name', () => {
        const onCrisis = vi.fn()
        const prev = [aiMessage()]
        const { result } = applyStreamPayload(
            { agent: 'crisis', agentName: '危机 Agent' },
            prev,
            onCrisis,
        )
        expect(onCrisis).toHaveBeenCalledOnce()
        expect(result.agentName).toBe('危机 Agent')
    })

    it('removes empty AI placeholder on error payload', () => {
        const prev = [aiMessage('')]
        const { next, result } = applyStreamPayload({ error: '服务异常' }, prev)
        expect(result.ok).toBe(false)
        expect(next).toHaveLength(0)
    })
})
