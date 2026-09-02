import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { createChat, deleteSession, getAnalysisResult, getSessionDetail, getSessionsByPage } from '../apis/sessions'
import AgentCard from './chat/AgentCard'
import ChatHeader from './chat/ChatHeader'
import ChatWindow from './chat/ChatWindow'
import EmotionGarden from './chat/EmotionGarden'
import MessageInput from './chat/MessageInput'
import SessionList from './chat/SessionList'
import AiDisclaimerBanner from './chat/AiDisclaimerBanner'
import CrisisInterventionModal from './chat/CrisisInterventionModal'
import { useChatStream } from '../hooks/useChatStream'
import type { emotionAnalysType, newChatParam, sessionDetailType, sessionItemType } from '../types/sessionsType'
import { generateUniqueId } from '../utils/stream'
import { normalizeSessionId } from '../utils'

export default function Consultation() {
    const location = useLocation()
    const [isDisabled, setIsDisabled] = useState(false)
    const [msg, setMsg] = useState('')
    const [currentSession, setCurrentSession] = useState<newChatParam>()
    const [list, setList] = useState<sessionItemType[]>([])
    const [chatList, setChatList] = useState<sessionDetailType[]>([])
    const [currentEmotion, setCurrentEmotion] = useState<emotionAnalysType>()
    const [crisisModalOpen, setCrisisModalOpen] = useState(false)

    const getEmotion = useCallback(async (sessionId: string) => {
        try {
            const res = await getAnalysisResult(normalizeSessionId(sessionId))
            setCurrentEmotion(res.data)
            if (res.data && (res.data.riskLevel ?? 0) >= 3) {
                setCrisisModalOpen(true)
            }
        } catch (error) {
            console.error('获取分析结果失败:', error)
        }
    }, [])

    const { isAiTyping, setIsAiTyping, sendMessageToAI, abortStream, activeAgent } = useChatStream({
        onStreamClose: getEmotion,
        onCrisisDetected: () => setCrisisModalOpen(true),
    })

    const getSessionsList = useCallback(async () => {
        try {
            const res = await getSessionsByPage({ pageNum: '1', pageSize: '20' })
            if (res?.data?.records) {
                setList(res.data.records)
            } else {
                setList([])
            }
        } catch (error) {
            console.error('获取会话列表失败:', error)
            setList([])
            const errMsg = (error as Error).message || ''
            if (errMsg.includes('未登录') || errMsg.includes('登录')) {
                message.warning('请先登录')
            } else if (errMsg) {
                message.error(errMsg)
            }
        }
    }, [])

    useEffect(() => {
        getSessionsList()
    }, [getSessionsList])

    useEffect(() => {
        const state = location.state as { sessionId?: number; sessionTitle?: string } | null
        if (!state?.sessionId) return

        const loadPendingSession = async () => {
            abortStream()
            getEmotion(state.sessionId!.toString())
            setCurrentSession({
                sessionId: state.sessionId!.toString(),
                sessionTitle: state.sessionTitle || '会话',
                status: 'ACTIVE',
            })
            setIsAiTyping(false)

            try {
                const res = await getSessionDetail(state.sessionId!.toString())
                setChatList(res?.data && Array.isArray(res.data) ? res.data : [])
            } catch (error) {
                console.error('获取会话详情失败:', error)
                setChatList([])
                message.error('加载会话失败')
            }
        }

        loadPendingSession()
        window.history.replaceState({}, document.title)
    }, [location.state, abortStream, getEmotion, setIsAiTyping])

    const createNewSession = async () => {
        try {
            const res = await createChat({ initialMessage: '', sessionTitle: '新会话' })
            if (res?.data) setCurrentSession(res.data)
        } catch (error) {
            console.error('创建新会话失败:', error)
            message.error('创建会话失败，请重试')
        }
    }

    const handleSend = async () => {
        if (!msg.trim() || isDisabled || isAiTyping) return

        const messageContent = msg.trim()
        setMsg('')
        setIsDisabled(true)

        try {
            const userMessage: sessionDetailType = {
                id: generateUniqueId(),
                content: messageContent,
                senderType: 1,
                senderTypeDesc: '用户',
                messageType: 1,
                messageTypeDesc: '文本',
                contentLength: messageContent.length,
                contentPreview: messageContent.substring(0, 50),
                createdAt: new Date().toISOString(),
                sessionId: currentSession?.sessionId ? parseInt(currentSession.sessionId) : 0
            }
            setChatList(prev => [...prev, userMessage])

            let sessionId = currentSession?.sessionId
            if (!sessionId) {
                const res = await createChat({
                    initialMessage: '',
                    sessionTitle: `小暖同学_${Date.now()}`
                })
                if (res?.data) {
                    sessionId = res.data.sessionId
                    setCurrentSession(res.data)
                    userMessage.sessionId = parseInt(sessionId)
                    await getSessionsList()
                } else {
                    throw new Error('创建会话失败')
                }
            }

            await sendMessageToAI(messageContent, sessionId, setChatList)
        } catch (error) {
            console.error('发送消息失败:', error)
            message.error('发送消息失败，请重试')
        } finally {
            setIsDisabled(false)
        }
    }

    const handleSessionClick = async (session: sessionItemType) => {
        abortStream()
        getEmotion(session.id.toString())
        setCurrentSession({
            sessionId: session.id.toString(),
            sessionTitle: session.sessionTitle,
            status: 'ACTIVE'
        })
        setIsAiTyping(false)

        try {
            const res = await getSessionDetail(session.id.toString())
            setChatList(res?.data && Array.isArray(res.data) ? res.data : [])
        } catch (error) {
            console.error('获取会话详情失败:', error)
            setChatList([])
            message.error('加载会话失败')
        }
    }

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await deleteSession(sessionId)
            message.success('删除成功')
            if (normalizeSessionId(currentSession?.sessionId) === normalizeSessionId(sessionId)) {
                setCurrentSession(undefined)
                setChatList([])
                setCurrentEmotion(undefined)
            }
            await getSessionsList()
        } catch (error) {
            console.error('删除会话失败:', error)
            message.error('删除失败，请重试')
        }
    }

    const handleNew = async () => {
        abortStream()
        setChatList([])
        setCurrentEmotion(undefined)
        await createNewSession()
        await getSessionsList()
    }

    return (
        <div className='flex bg-white w-4/5 mx-auto'>
            <div className='p-5 flex flex-col gap-5 mx-10'>
                <AgentCard />
                <EmotionGarden emotion={currentEmotion} />
                <SessionList
                    sessions={list}
                    onSessionClick={handleSessionClick}
                    onDeleteSession={handleDeleteSession}
                />
            </div>
            <div className='border-1 p-5 h-full shadow-md rounded-lg flex flex-col w-[700px]'>
                <ChatHeader onNewSession={handleNew} activeAgent={activeAgent} />
                <AiDisclaimerBanner />
                <ChatWindow messages={chatList} isAiTyping={isAiTyping} />
                <MessageInput
                    value={msg}
                    disabled={isDisabled || isAiTyping}
                    onChange={setMsg}
                    onSend={handleSend}
                />
            </div>
            <CrisisInterventionModal
                open={crisisModalOpen}
                onClose={() => setCrisisModalOpen(false)}
            />
        </div>
    )
}
