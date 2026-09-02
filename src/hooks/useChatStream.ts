import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { apiBaseUrl } from '../config'
import type { sessionDetailType } from '../types/sessionsType'
import { applyStreamPayload as applyPayload } from '../utils/chatStreamPayload'
import { generateUniqueId } from '../utils/stream'

interface UseChatStreamOptions {
    onStreamClose?: (sessionId: string) => void
    onCrisisDetected?: () => void
}

function handleStreamPayload(
    payload: Record<string, unknown>,
    setChatList: React.Dispatch<React.SetStateAction<sessionDetailType[]>>,
    onCrisisDetected?: () => void,
    setActiveAgent?: (name: string | null) => void,
) {
    let result = { ok: true as boolean, agentName: undefined as string | undefined }
    setChatList(prev => {
        const applied = applyPayload(payload, prev, onCrisisDetected)
        result = { ok: applied.result.ok, agentName: applied.result.agentName }
        return applied.next
    })
    if (result.agentName && setActiveAgent) {
        setActiveAgent(result.agentName)
    }
    if (!result.ok) {
        message.error(String(payload.error))
    }
    return result.ok
}

export function useChatStream(options: UseChatStreamOptions = {}) {
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const onStreamCloseRef = useRef(options.onStreamClose)
    const onCrisisDetectedRef = useRef(options.onCrisisDetected)

    useEffect(() => {
        onStreamCloseRef.current = options.onStreamClose
        onCrisisDetectedRef.current = options.onCrisisDetected
    }, [options.onStreamClose, options.onCrisisDetected])

    const abortStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsAiTyping(false)
    }, [])

    const runStream = useCallback(async (
        url: string,
        body: unknown | undefined,
        sessionId: string,
        setChatList: React.Dispatch<React.SetStateAction<sessionDetailType[]>>,
        prependAiPlaceholder = true,
    ) => {
        setIsAiTyping(true)
        setActiveAgent(null)
        abortControllerRef.current = new AbortController()

        if (prependAiPlaceholder) {
            const aiMessage: sessionDetailType = {
                id: generateUniqueId(),
                content: '',
                senderType: 2,
                senderTypeDesc: 'AI助手',
                messageType: 1,
                messageTypeDesc: '文本',
                contentLength: 0,
                contentPreview: '',
                createdAt: new Date().toISOString(),
                sessionId: parseInt(sessionId),
            }
            setChatList(prev => [...prev, aiMessage])
        }

        try {
            await fetchEventSource(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                credentials: 'include',
                body: body ? JSON.stringify(body) : undefined,
                signal: abortControllerRef.current.signal,
                onmessage: (event) => {
                    if (event.data === '[DONE]') {
                        setIsAiTyping(false)
                        return
                    }
                    try {
                        const payload = JSON.parse(event.data) as Record<string, unknown>
                        const ok = handleStreamPayload(
                            payload,
                            setChatList,
                            onCrisisDetectedRef.current,
                            setActiveAgent,
                        )
                        if (!ok) {
                            setIsAiTyping(false)
                            setActiveAgent(null)
                        }
                    } catch (error) {
                        console.error('解析SSE数据失败:', error)
                    }
                },
                onclose: () => {
                    setIsAiTyping(false)
                    onStreamCloseRef.current?.(sessionId)
                },
                onerror: (error) => {
                    console.error('SSE错误:', error)
                    setIsAiTyping(false)
                    message.error('连接中断，请重试')
                    throw error
                },
            })
        } catch (error) {
            console.error('流式请求失败:', error)
            setIsAiTyping(false)
            message.error('请求失败，请重试')
        }
    }, [])

    const sendMessageToAI = useCallback(async (
        messageContent: string,
        sessionId: string,
        setChatList: React.Dispatch<React.SetStateAction<sessionDetailType[]>>
    ) => {
        if (!sessionId) return
        await runStream(
            `${apiBaseUrl}/psychological-chat/stream`,
            { sessionId, userMessage: messageContent },
            sessionId,
            setChatList,
            true,
        )
    }, [runStream])

    const regenerateMessage = useCallback(async (
        sessionId: string,
        messageId: number,
        setChatList: React.Dispatch<React.SetStateAction<sessionDetailType[]>>,
    ) => {
        if (!sessionId || !messageId) return
        setChatList(prev => {
            const index = prev.findIndex(item => item.id === messageId)
            if (index < 0) return prev
            return prev.slice(0, index)
        })
        await runStream(
            `${apiBaseUrl}/psychological-chat/sessions/${sessionId}/messages/${messageId}/regenerate`,
            undefined,
            sessionId,
            setChatList,
            true,
        )
    }, [runStream])

    return { isAiTyping, setIsAiTyping, sendMessageToAI, regenerateMessage, abortStream, activeAgent }
}
