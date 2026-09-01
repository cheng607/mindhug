import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { UserOutlined } from '@ant-design/icons'
import AgentIcon from '../../assets/agent4.png'
import type { sessionDetailType } from '../../types/sessionsType'
import Empty from '../common/Empty'

interface ChatWindowProps {
    messages: sessionDetailType[]
    isAiTyping: boolean
}

export default function ChatWindow({ messages, isAiTyping }: ChatWindowProps) {
    const normalizedMessages = useMemo(() => {
        if (!Array.isArray(messages)) return []
        return [...messages].sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime()
            const timeB = new Date(b.createdAt).getTime()
            if (timeA !== timeB) return timeA - timeB
            return Number(a.id) - Number(b.id)
        })
    }, [messages])

    const typingMessageId = useMemo(() => {
        if (!isAiTyping || normalizedMessages.length === 0) return null
        for (let i = normalizedMessages.length - 1; i >= 0; i--) {
            const item = normalizedMessages[i]
            if (item.senderType === 2 && !item.content?.trim()) return item.id
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

    return (
        <div className='h-[800px] p-3 overflow-y-scroll'>
            {normalizedMessages.length === 0 ? (
                <Empty description="开始一段新的对话吧" className="h-full" />
            ) : normalizedMessages.map(item => {
                const isUser = item.senderType === 1
                return (
                    <div className={`p-4 flex ${isUser ? 'justify-end' : 'justify-start'}`} key={item.id}>
                        <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {isUser ? (
                                <UserOutlined className='w-8 h-8 flex items-center justify-center rounded-full text-white bg-[#5B616D]' />
                            ) : (
                                <img src={AgentIcon} className='w-8 h-8 rounded-full' alt="AI" />
                            )}
                            <div className={isUser ? 'text-right' : 'text-left'}>
                                <div className={`inline-block text-gray-800 px-3 py-2 my-2 rounded-lg break-words ${isUser ? 'bg-[#F5F7FA] rounded-tr-none' : 'bg-[#FFF7ED] rounded-tl-none'}`}>
                                    {renderMessageContent(item)}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                    {new Date(item.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
