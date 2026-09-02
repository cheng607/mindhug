import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { BookOutlined, DeleteOutlined, EditOutlined, MoreOutlined, RedoOutlined, UserOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import AgentIcon from '../../assets/agent4.png'
import type { sessionDetailType } from '../../types/sessionsType'
import Empty from '../common/Empty'

interface ChatWindowProps {
    messages: sessionDetailType[]
    isAiTyping: boolean
    onEditMessage?: (message: sessionDetailType) => void
    onDeleteMessage?: (message: sessionDetailType) => void
    onRegenerateMessage?: (message: sessionDetailType) => void
}

export default function ChatWindow({
    messages,
    isAiTyping,
    onEditMessage,
    onDeleteMessage,
    onRegenerateMessage,
}: ChatWindowProps) {
    const normalizedMessages = useMemo(() => {
        if (!Array.isArray(messages)) return []
        return [...messages].sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime()
            const timeB = new Date(b.createdAt).getTime()
            if (timeA !== timeB) return timeA - timeB
            if (a.senderType !== b.senderType) return a.senderType - b.senderType
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
                <>
                    <div className='whitespace-pre-wrap break-words [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1'>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                    {item.citations && item.citations.length > 0 && (
                        <div className='mt-3 pt-2 border-t border-orange-200'>
                            <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
                                <BookOutlined />
                                <span>参考来源</span>
                            </div>
                            <div className='flex flex-col gap-1'>
                                {item.citations.map((cite, index) => (
                                    <Link
                                        key={`${cite.articleId}-${index}`}
                                        to={`/article/${cite.articleId}`}
                                        className='text-xs text-blue-600 hover:text-blue-800 hover:underline text-left'
                                        target='_blank'
                                    >
                                        《{cite.title}》
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )
        }
        return <span className='whitespace-pre-wrap break-words'>{content}</span>
    }

    const buildMenuItems = (item: sessionDetailType): MenuProps['items'] => {
        const items: MenuProps['items'] = []
        if (item.senderType === 1 && onEditMessage) {
            items.push({
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑',
                onClick: () => onEditMessage(item),
            })
        }
        if (item.senderType === 2 && onRegenerateMessage && item.content?.trim()) {
            items.push({
                key: 'regenerate',
                icon: <RedoOutlined />,
                label: '重新生成',
                onClick: () => onRegenerateMessage(item),
            })
        }
        if (onDeleteMessage) {
            items.push({
                key: 'delete',
                icon: <DeleteOutlined />,
                label: '删除',
                danger: true,
                onClick: () => onDeleteMessage(item),
            })
        }
        return items
    }

    return (
        <div className='flex-1 min-h-[320px] max-h-[70vh] lg:h-[800px] p-3 overflow-y-scroll'>
            {normalizedMessages.length === 0 ? (
                <Empty description="开始一段新的对话吧" className="h-full" />
            ) : normalizedMessages.map(item => {
                const isUser = item.senderType === 1
                const menuItems = buildMenuItems(item)
                return (
                    <div className={`p-4 flex ${isUser ? 'justify-end' : 'justify-start'}`} key={item.id}>
                        <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {isUser ? (
                                <UserOutlined className='w-8 h-8 flex items-center justify-center rounded-full text-white bg-[#5B616D]' />
                            ) : (
                                <img src={AgentIcon} className='w-8 h-8 rounded-full' alt="AI" />
                            )}
                            <div className={isUser ? 'text-right' : 'text-left'}>
                                <div className={`inline-flex items-start gap-1 text-gray-800 px-3 py-2 my-2 rounded-lg break-words ${isUser ? 'bg-[#F5F7FA] rounded-tr-none' : 'bg-[#FFF7ED] rounded-tl-none'}`}>
                                    <div className='flex-1'>{renderMessageContent(item)}</div>
                                    {menuItems && menuItems.length > 0 && (
                                        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                            <button type='button' className='text-gray-400 hover:text-gray-600 p-1 shrink-0'>
                                                <MoreOutlined />
                                            </button>
                                        </Dropdown>
                                    )}
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
