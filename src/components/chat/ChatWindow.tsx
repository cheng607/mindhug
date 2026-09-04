import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { BookOutlined, DeleteOutlined, EditOutlined, MoreOutlined, RedoOutlined, UserOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import AgentIcon from '../../assets/agent4.png'
import type { sessionDetailType } from '../../types/sessionsType'
import { formatDateTime } from '../../utils'
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
    const scrollRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, [normalizedMessages, isAiTyping])

    const renderMessageContent = (item: sessionDetailType) => {
        const content = item.content || ''
        const isTypingPlaceholder = item.id === typingMessageId

        if (isTypingPlaceholder) {
            return (
                <span className="inline-flex items-center gap-1 text-gray-500">
                    <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400" />
                    </span>
                    正在输入
                </span>
            )
        }
        if (!content.trim()) {
            return <span className="text-gray-400">（空消息）</span>
        }
        if (item.senderType === 2) {
            return (
                <>
                    <div className="break-words text-gray-800 [&_li]:my-0.5 [&_ol]:my-2 [&_p]:my-1.5 [&_ul]:my-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                    {item.citations && item.citations.length > 0 && (
                        <div className="mt-3 rounded-lg border border-orange-100 bg-white/70 px-3 py-2">
                            <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500">
                                <BookOutlined />
                                <span>参考来源</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                {item.citations.map((cite, index) => {
                                    const label = cite.source === 'web' ? `《${cite.title}》（网页）` : `《${cite.title}》`
                                    if (cite.url) {
                                        return (
                                            <a
                                                key={`web-${cite.url}-${index}`}
                                                href={cite.url}
                                                className="text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                target="_blank"
                                                rel="noreferrer noopener"
                                            >
                                                {label}
                                            </a>
                                        )
                                    }
                                    if (cite.articleId) {
                                        return (
                                            <Link
                                                key={`${cite.articleId}-${index}`}
                                                to={`/article/${cite.articleId}`}
                                                className="text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                target="_blank"
                                            >
                                                {label}
                                            </Link>
                                        )
                                    }
                                    return (
                                        <span key={`cite-${index}`} className="text-left text-xs text-gray-600">
                                            {label}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )
        }
        return <span className="whitespace-pre-wrap break-words">{content}</span>
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
        <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-white">
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            {normalizedMessages.length === 0 ? (
                <Empty description="开始一段新的对话吧，小暖在这里倾听你" className="min-h-[280px]" />
            ) : normalizedMessages.map(item => {
                const isUser = item.senderType === 1
                const menuItems = buildMenuItems(item)
                return (
                    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`} key={item.id}>
                        <div className={`flex max-w-[88%] gap-2.5 sm:max-w-[82%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {isUser ? (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-white">
                                    <UserOutlined className="text-sm" />
                                </div>
                            ) : (
                                <img src={AgentIcon} className="h-8 w-8 shrink-0 rounded-full ring-2 ring-orange-100" alt="AI" />
                            )}
                            <div className={`min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-flex max-w-full items-start gap-1 rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                    isUser
                                        ? 'rounded-tr-md bg-slate-100 text-gray-800'
                                        : 'rounded-tl-md border border-orange-100 bg-[#FFF7ED] text-gray-800'
                                }`}>
                                    <div className="min-w-0 flex-1 text-left">{renderMessageContent(item)}</div>
                                    {menuItems && menuItems.length > 0 && (
                                        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                            <button type="button" className="shrink-0 rounded p-1 text-gray-400 transition hover:bg-black/5 hover:text-gray-600">
                                                <MoreOutlined />
                                            </button>
                                        </Dropdown>
                                    )}
                                </div>
                                <div className="mt-1 px-1 text-[11px] text-gray-400">
                                    {formatDateTime(item.createdAt)}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
            </div>
        </div>
    )
}
