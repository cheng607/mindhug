import { Input, Modal, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
    createChat,
    deleteMessage,
    deleteSession,
    getAnalysisResult,
    getSessionDetail,
    getSessionsByPage,
    updateMessage,
} from '../apis/sessions'
import ChatSidebar from './chat/ChatSidebar'
import ChatHeader from './chat/ChatHeader'
import ChatWindow from './chat/ChatWindow'
import MessageInput from './chat/MessageInput'
import AiDisclaimerBanner from './chat/AiDisclaimerBanner'
import CrisisInterventionModal from './chat/CrisisInterventionModal'
import { useChatStream } from '../hooks/useChatStream'
import type { emotionAnalysType, newChatParam, sessionDetailType, sessionItemType } from '../types/sessionsType'
import { generateUniqueId } from '../utils/stream'
import { normalizeSessionId } from '../utils'

const isPersistedMessageId = (id: number) => Number.isInteger(id) && id > 0 && id < 1_000_000_000

export default function Consultation() {
    const location = useLocation()
    const [isDisabled, setIsDisabled] = useState(false)
    const [msg, setMsg] = useState('')
    const [currentSession, setCurrentSession] = useState<newChatParam>()
    const [list, setList] = useState<sessionItemType[]>([])
    const [chatList, setChatList] = useState<sessionDetailType[]>([])
    const [currentEmotion, setCurrentEmotion] = useState<emotionAnalysType>()
    const [crisisModalOpen, setCrisisModalOpen] = useState(false)
    const [emotionTagFilter, setEmotionTagFilter] = useState('')
    const [editOpen, setEditOpen] = useState(false)
    const [editContent, setEditContent] = useState('')
    const [editingMessage, setEditingMessage] = useState<sessionDetailType | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const reloadMessages = useCallback(async (sessionId: string) => {
        try {
            const res = await getSessionDetail(sessionId)
            setChatList(res?.data && Array.isArray(res.data) ? res.data : [])
        } catch (error) {
            console.error('刷新消息失败:', error)
        }
    }, [])

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

    const getSessionsList = useCallback(async () => {
        try {
            const res = await getSessionsByPage({
                pageNum: '1',
                pageSize: '20',
                emotionTag: emotionTagFilter || undefined,
            })
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
    }, [emotionTagFilter])

    const handleStreamClose = useCallback(async (sessionId: string) => {
        await reloadMessages(sessionId)
        await getEmotion(sessionId)
        await getSessionsList()
    }, [reloadMessages, getEmotion, getSessionsList])

    const { isAiTyping, setIsAiTyping, sendMessageToAI, regenerateMessage, abortStream, activeAgent } = useChatStream({
        onStreamClose: handleStreamClose,
        onCrisisDetected: () => setCrisisModalOpen(true),
    })

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

    const handleEditMessage = (item: sessionDetailType) => {
        if (!currentSession?.sessionId || !isPersistedMessageId(item.id)) {
            message.warning('请等待消息保存后再编辑')
            return
        }
        setEditingMessage(item)
        setEditContent(item.content)
        setEditOpen(true)
    }

    const handleConfirmEdit = async () => {
        if (!editingMessage || !currentSession?.sessionId || !editContent.trim()) return
        try {
            await updateMessage(currentSession.sessionId, editingMessage.id, editContent.trim())
            message.success('消息已更新')
            setEditOpen(false)
            await reloadMessages(currentSession.sessionId)
            await getSessionsList()
        } catch (error) {
            message.error((error as Error).message || '更新失败')
        }
    }

    const handleDeleteMessage = async (item: sessionDetailType) => {
        if (!currentSession?.sessionId || !isPersistedMessageId(item.id)) {
            message.warning('请等待消息保存后再删除')
            return
        }
        try {
            await deleteMessage(currentSession.sessionId, item.id)
            message.success('已删除')
            await reloadMessages(currentSession.sessionId)
            await getSessionsList()
        } catch (error) {
            message.error((error as Error).message || '删除失败')
        }
    }

    const handleRegenerateMessage = async (item: sessionDetailType) => {
        if (!currentSession?.sessionId || !isPersistedMessageId(item.id) || isAiTyping) return
        await regenerateMessage(currentSession.sessionId, item.id, setChatList)
    }

    return (
        <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-white">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="关闭侧边栏"
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div
                className={`fixed bottom-0 left-0 top-11 z-50 flex transition-transform duration-200 lg:relative lg:top-auto lg:z-auto lg:h-full lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <ChatSidebar
                    sessions={list}
                    currentSessionId={currentSession?.sessionId}
                    emotion={currentEmotion}
                    emotionTagFilter={emotionTagFilter}
                    onNewSession={() => {
                        setSidebarOpen(false)
                        handleNew()
                    }}
                    onEmotionTagFilterChange={setEmotionTagFilter}
                    onSessionClick={(session) => {
                        setSidebarOpen(false)
                        handleSessionClick(session)
                    }}
                    onDeleteSession={handleDeleteSession}
                />
            </div>
            <main className="flex min-w-0 flex-1 flex-col bg-white">
                <ChatHeader
                    activeAgent={activeAgent}
                    sessionTitle={currentSession?.sessionTitle}
                    onOpenSidebar={() => setSidebarOpen(true)}
                />
                <AiDisclaimerBanner />
                <ChatWindow
                    messages={chatList}
                    isAiTyping={isAiTyping}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onRegenerateMessage={handleRegenerateMessage}
                />
                <MessageInput
                    value={msg}
                    disabled={isDisabled || isAiTyping}
                    onChange={setMsg}
                    onSend={handleSend}
                />
            </main>
            <CrisisInterventionModal
                open={crisisModalOpen}
                onClose={() => setCrisisModalOpen(false)}
            />
            <Modal
                title="编辑消息"
                open={editOpen}
                onOk={handleConfirmEdit}
                onCancel={() => setEditOpen(false)}
                destroyOnClose
            >
                <Input.TextArea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={2000}
                />
            </Modal>
        </div>
    )
}
