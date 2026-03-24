import { Button, message } from 'antd'
import AgentIcon from '../assets/agent4.png'
import HeartIcon from '../assets/heartIcon.png'
import HeartImg from '../assets/icon5.png'
import { SendOutlined } from '@ant-design/icons'
import TextArea from 'antd/es/input/TextArea'
import { useEffect, useMemo, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { createChat, deleteSession, getAnalysisResult, getSessionDetail, getSessionsByPage } from '../apis/sessions'
import type { emotionAnalysType, newChatParam, sessionDetailType, sessionItemType } from '../types/sessionsType'
import { FieldTimeOutlined, MessageOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { formatDate } from '../utils'

export default function Consultation() {
    const [isDisabled, setIsDisabled] = useState(false)
    const [msg, setMsg] = useState('')
    const [currentSession, setCurrentSession] = useState<newChatParam>()
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [list, setList] = useState<sessionItemType[]>([])
    const [chatList, setChatList] = useState<sessionDetailType[]>([])
    const abortControllerRef = useRef<AbortController | null>(null)
    const [currentEmotion, setCurrentEmotion] = useState<emotionAnalysType>()

    const normalizedMessages = useMemo(() => {
        if (!Array.isArray(chatList)) return []

        return [...chatList].sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime()
            const timeB = new Date(b.createdAt).getTime()
            if (timeA !== timeB) return timeA - timeB
            return Number(a.id) - Number(b.id)
        })
    }, [chatList])

    const typingMessageId = useMemo(() => {
        if (!isAiTyping || normalizedMessages.length === 0) return null

        for (let i = normalizedMessages.length - 1; i >= 0; i--) {
            const item = normalizedMessages[i]
            if (item.senderType === 2 && !item.content?.trim()) {
                return item.id
            }
        }
        return null
    }, [isAiTyping, normalizedMessages])

    const renderMessageContent = (item: sessionDetailType) => {
        const content = item.content || ''
        const isTypingPlaceholder = item.id === typingMessageId

        if (isTypingPlaceholder) {
            return <span className='text-gray-500'>正在输入中...</span>
        }

        if (!content.trim()) {
            return <span className='text-gray-400'>（空消息）</span>
        }

        if (item.senderType === 2) {
            return (
                <div className='whitespace-pre-wrap break-words [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1'>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {content}
                    </ReactMarkdown>
                </div>
            )
        }

        return <span className='whitespace-pre-wrap break-words'>{content}</span>
    }

    // 生成唯一ID的函数
    const generateUniqueId = () => {
        return Math.floor(Math.random() * 1000000000) + Date.now()
    }

    // 合并流式分片，兼容增量、累计和重叠片段，避免内容重复
    const mergeStreamChunk = (existing: string, incoming: string) => {
        if (!incoming) return existing
        if (!existing) return incoming

        // 累计模式：本次内容已包含历史全部
        if (incoming.startsWith(existing)) {
            return incoming
        }

        // 重复事件：本次内容已经被拼接过
        if (existing.endsWith(incoming)) {
            return existing
        }

        // 重叠模式：existing 尾部与 incoming 头部有交集
        const maxOverlap = Math.min(existing.length, incoming.length)
        for (let overlap = maxOverlap; overlap > 0; overlap--) {
            const suffix = existing.slice(-overlap)
            const prefix = incoming.slice(0, overlap)
            if (suffix === prefix) {
                return existing + incoming.slice(overlap)
            }
        }

        // 无重叠，按增量拼接
        return existing + incoming
    }

    // 初始化时获取会话列表
    useEffect(() => {
        getSessionsList()
    }, [])

    // 获取会话列表
    const getSessionsList = async () => {
        try {
            const res = await getSessionsByPage({ pageNum: '1', pageSize: '20' })
            if (res && res.data && Array.isArray(res.data.records)) {
                setList(res.data.records)
            } else {
                setList([])
            }
        } catch (error) {
            console.error('获取会话列表失败:', error)
            setList([])
        }
    }

    // 创建新会话
    const createNewSession = async () => {
        try {
            const res = await createChat({ initialMessage: '', sessionTitle: '新会话' })
            if (res && res.data) {
                setCurrentSession(res.data)
            }
        } catch (error) {
            console.error('创建新会话失败:', error)
            message.error('创建会话失败，请重试')
        }
    }

    // 发送消息到AI
    const sendMessageToAI = async (messageContent: string, sessionId: string) => {
        if (!sessionId) return

        setIsAiTyping(true)
        abortControllerRef.current = new AbortController()

        try {
            const aiMessage: sessionDetailType = {
                id: generateUniqueId(),
                content: '',
                senderType: 2, // AI
                senderTypeDesc: 'AI助手',
                messageType: 1,
                messageTypeDesc: '文本',
                contentLength: 0,
                contentPreview: '',
                createdAt: new Date().toISOString(),
                sessionId: parseInt(sessionId)
            }

            // 添加AI消息占位符
            setChatList(prev => [...prev, aiMessage])

            await fetchEventSource('/api/psychological-chat/stream', {
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
                    getEmotion(sessionId)
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
    }

    // 处理发送消息
    const handleSend = async () => {
        if (!msg.trim() || isDisabled || isAiTyping) return

        const messageContent = msg.trim()
        setMsg('')
        setIsDisabled(true)
        console.log('发送消息', currentSession)
        try {
            // 添加用户消息到本地状态
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

            // 如果没有当前会话，先创建新会话
            let sessionId = currentSession?.sessionId
            if (!sessionId) {
                const res = await createChat({ initialMessage: messageContent, sessionTitle: `小暖同学_${new Date().getTime()}` })
                if (res && res.data) {
                    sessionId = res.data.sessionId
                    setCurrentSession(res.data)
                    // 更新用户消息的sessionId
                    userMessage.sessionId = parseInt(sessionId)
                    // 更新会话列表
                    await getSessionsList()
                } else {
                    throw new Error('创建会话失败')
                }
            }

            // 发送消息到AI
            await sendMessageToAI(messageContent, sessionId)
        } catch (error) {
            console.error('发送消息失败:', error)
            message.error('发送消息失败，请重试')
        } finally {
            setIsDisabled(false)
        }
    }

    // 快捷键发送
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter: 换行，不发送
                return
            } else {
                // Enter: 发送消息
                e.preventDefault()
                handleSend()
            }
        }
    }

    // 处理会话点击
    const handleSessionClick = async (session: sessionItemType) => {
        // 取消当前请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        getEmotion(session.id.toString())
        const sessionData = {
            sessionId: session.id.toString(),
            sessionTitle: session.sessionTitle,
            status: 'ACTIVE'
        }
        setCurrentSession(sessionData)
        setIsAiTyping(false)

        try {
            const res = await getSessionDetail(session.id.toString())
            if (res && res.data && Array.isArray(res.data)) {
                setChatList(res.data)
            } else {
                setChatList([])
            }
        } catch (error) {
            console.error('获取会话详情失败:', error)
            setChatList([])
            message.error('加载会话失败')
        }
    }

    // 处理删除会话
    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation() // 阻止事件冒泡

        try {
            await deleteSession(sessionId)
            message.success('删除成功')

            // 如果删除的是当前会话，清空聊天记录
            if (currentSession?.sessionId === sessionId) {
                setCurrentSession(undefined)
                setChatList([])
            }

            // 刷新会话列表
            await getSessionsList()
        } catch (error) {
            console.error('删除会话失败:', error)
            message.error('删除失败，请重试')
        }
    }

    // 处理新建会话
    const handleNew = async () => {
        // 取消当前请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        setIsAiTyping(false)
        await createNewSession()
        await getSessionsList()
    }

    // 处理情绪分析
    const getEmotion = async (sessionId: string) => {
        if (!sessionId.includes('session')) {
            sessionId = 'session_' + sessionId
        }
        try {
            const res = await getAnalysisResult(sessionId)
            setCurrentEmotion(res.data)
        } catch (error) {
            console.error('获取分析结果失败:', error)
        }
    }

    return (
        <div className='flex bg-white w-4/5 mx-auto'>
            <div className='p-5 flex flex-col gap-5 mx-10'>
                {/* logo区域 */}
                <div className='flex flex-col items-center gap-2 bg-[#FEFEFC] px-6 py-3 shadow-md rounded-xl border-2 w-72'>
                    <img src={AgentIcon} alt="" />
                    <div className='text-[#E79E39] font-medium'>宁渡AI助手</div>
                    <div className='text-green-700 flex items-center gap-2 text-xs'>
                        <div className='bg-green-700 w-1.5 h-1.5 rounded-full'></div>
                        在线服务中
                    </div>
                </div>
                {/* 情绪花园 */}
                <div className='flex flex-col items-center bg-[#FAF4E6] rounded-xl py-6 gap-3 w-72'>
                    <div className='self-start text-amber-800 font-bold px-3'>情绪花园</div>
                    <div className='w-20 h-20 border-white border-4 bg-pink-300 rounded-full flex items-center justify-center text-white'>{currentEmotion?.primaryEmotion}</div>
                    <div className='text-gray-500'>
                        今天感觉
                        <span className='font-bold text-black mx-3'>{currentEmotion?.primaryEmotion}</span>
                    </div>
                    <div className='text-xs'>{currentEmotion?.icon}{currentEmotion?.label}</div>
                    <div className='bg-white flex w-4/5 items-center gap-3 p-3 rounded-lg shadow-md'>
                        <img src={HeartIcon} className='w-6 h-6' />
                        <div className='flex flex-col gap-2'>
                            <div className='text-amber-900 font-bold text-xs'>给你的小建议</div>
                            <div className='text-gray-600 text-xs'>{currentEmotion?.suggestion}</div>
                        </div>
                    </div>
                    <div className='text-amber-800'>治愈小行动</div>
                    <div className='flex flex-col gap-3'>
                        {currentEmotion?.improvementSuggestions.map((suggestion, index) => (
                            <div key={index} className='bg-white rounded-xl flex items-center p-3 w-56 gap-3'>
                                <div className='bg-yellow-400 w-1.5 h-1.5 rounded-full'></div>
                                <div>{suggestion}</div>
                            </div>
                        ))}
                    </div>
                    {/* 风险提示 */}
                    {currentEmotion?.isNegative && currentEmotion.riskLevel > 1 ? (
                        <div className='flex flex-col items-center bg-yellow-100 px-20 py-2 rounded-lg'>
                            <div className='text-amber-800'>温馨提醒</div>
                            <div className='text-amber-600 text-xs'>{currentEmotion?.riskDescription}</div>
                        </div>
                    ) : ('')}
                </div>
                {/* 历史消息区域 */}
                <div className='border-2 p-2 rounded-md shadow-md'>
                    <div className='font-bold'>会话历史</div>
                    <div className='max-h-80 overflow-y-scroll scrollbar-hide'>
                        {list && list.length > 0 ? list.map(item => (
                            <div key={item.id}
                                className='p-3 rounded-lg my-2 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors duration-200 relative'
                                onClick={() => { handleSessionClick(item) }}
                            >
                                <div className='flex justify-between'>
                                    <div>{item.sessionTitle}</div>
                                    <DeleteOutlined
                                        className='text-red-600'
                                        onClick={(e) => handleDeleteSession(item.id.toString(), e)}
                                    />
                                </div>
                                <div className='text-xs text-gray-500'>{item.lastMessageTime}</div>
                                <div className='text-ellipsis text-xs my-1 line-clamp-2 w-60'>{item.lastMessageContent || '暂无内容'}</div>
                                <div className='text-xs text-gray-500 flex gap-3'>
                                    <span><MessageOutlined />{item.messageCount || 0}</span>
                                    <span><FieldTimeOutlined />
                                        {formatDate(item.durationMinutes.toString())}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className='p-3 text-gray-500'>暂无会话历史</div>
                        )}
                    </div>
                </div>
            </div>
            <div className='border-1 p-5 h-full shadow-md rounded-lg flex flex-col w-[700px]'>
                <div className='p-3 bg-[#E89645] h-20 flex items-center justify-between'>
                    <div className='flex items-center'>
                        <img src={HeartImg} className='p-3' />
                        <div className='flex flex-col text-white gap-1'>
                            <div className='text-lg font-medium'>宁渡AI助手</div>
                            <div className='text-xs'>您的贴心AI心理健康助手</div>
                        </div>
                    </div>
                    <div
                        className='rounded-full bg-white w-8 h-8 flex items-center justify-center text-gray-400 mr-7 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95'
                        onClick={handleNew}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </div>
                {/* 对话区域 */}
                <div className='h-[800px] p-3 overflow-y-scroll'>
                    {normalizedMessages.length === 0 ? (
                        <div className='h-full flex items-center justify-center text-gray-400'>开始一段新的对话吧</div>
                    ) : normalizedMessages.map(item => {
                        const isUser = item.senderType === 1
                        return (
                            <div className={`p-4 flex ${isUser ? 'justify-end' : 'justify-start'}`} key={item.id}>
                                <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {isUser ? (
                                        <UserOutlined className='w-8 h-8 flex items-center justify-center rounded-full text-white bg-[#5B616D]' />
                                    ) : (
                                        <img src={AgentIcon} className='w-8 h-8 rounded-full' />
                                    )}
                                    <div className={`${isUser ? 'text-right' : 'text-left'}`}>
                                        <div
                                            className={`inline-block text-gray-800 px-3 py-2 my-2 rounded-lg break-words ${isUser ? 'bg-[#F5F7FA] rounded-tr-none' : 'bg-[#FFF7ED] rounded-tl-none'}`}
                                        >
                                            {renderMessageContent(item)}
                                        </div>
                                        <div className='text-xs text-gray-500 mt-1'>{new Date(item.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {/* 消息输入区域 */}
                <div className="flex items-center gap-3 p-3 border-t ">
                    <TextArea
                        showCount
                        maxLength={500}
                        placeholder="请输入内容"
                        style={{ height: 80, resize: 'none' }}
                        disabled={isDisabled}
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        className='bg-[#E99D3F] w-14 h-14 rounded-lg hover:bg-[#d88f38] transition-all duration-200 flex items-center justify-center'
                        ghost={false}
                        type="primary"
                        onClick={handleSend}
                    >
                        <SendOutlined className='text-lg text-white group-hover:text-black transition-colors duration-200' />
                    </Button>
                </div>
            </div>
        </div>
    )
}
