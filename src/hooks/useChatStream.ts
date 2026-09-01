import { useCallback, useRef, useState } from 'react'
import { message } from 'antd'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { apiBaseUrl } from '../config'
import type { sessionDetailType } from '../types/sessionsType'
import { generateUniqueId, mergeStreamChunk } from '../utils/stream'

interface UseChatStreamOptions {
    onStreamClose?: (sessionId: string) => void
}

export function useChatStream(options: UseChatStreamOptions = {}) {
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const onStreamCloseRef = useRef(options.onStreamClose)
    onStreamCloseRef.current = options.onStreamClose

    const abortStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsAiTyping(false)
    }, [])

    const sendMessageToAI = useCallback(async (
        messageContent: string,
        sessionId: string,
        setChatList: React.Dispatch<React.SetStateAction<sessionDetailType[]>>
    ) => {
        if (!sessionId) return

        setIsAiTyping(true)
        setActiveAgent(null)
        abortControllerRef.current = new AbortController()

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
            sessionId: parseInt(sessionId)
        }

        setChatList(prev => [...prev, aiMessage])

        try {
            await fetchEventSource(`${apiBaseUrl}/psychological-chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({ sessionId, userMessage: messageContent }),
                signal: abortControllerRef.current.signal,
                onmessage: (event) => {
                    if (event.data === '[DONE]') {
                        setIsAiTyping(false)
                        return
                    }

                    try {
                        const payload = JSON.parse(event.data)
                        if (payload.error) {
                            message.error(payload.error)
                            setIsAiTyping(false)
                            setActiveAgent(null)
                            setChatList(prev => {
                                const newList = [...prev]
                                const last = newList[newList.length - 1]
                                if (last?.senderType === 2 && !last.content?.trim()) {
                                    newList.pop()
                                }
                                return newList
                            })
                            return
                        }
                        if (payload.agentName) {
                            setActiveAgent(payload.agentName)
                        }
                        const chunk = payload.content ?? payload.data?.content
                        if (typeof chunk === 'string' && chunk.length > 0) {
                            setChatList(prev => {
                                const newList = [...prev]
                                const lastIndex = newList.length - 1
                                const lastMessage = newList[lastIndex]
                                if (lastMessage && lastMessage.senderType === 2) {
                                    const existing = lastMessage.content || ''
                                    const updated = mergeStreamChunk(existing, chunk)
                                    newList[lastIndex] = {
                                        ...lastMessage,
                                        content: updated,
                                        contentLength: updated.length,
                                        contentPreview: updated.substring(0, 50)
                                    }
                                }
                                return newList
                            })
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
                }
            })
        } catch (error) {
            console.error('发送消息失败:', error)
            setIsAiTyping(false)
            message.error('发送消息失败，请重试')
        }
    }, [])

    return { isAiTyping, setIsAiTyping, sendMessageToAI, abortStream, activeAgent }
}
