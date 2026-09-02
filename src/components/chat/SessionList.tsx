import { DeleteOutlined } from '@ant-design/icons'
import { Select, Tag } from 'antd'
import type { sessionItemType } from '../../types/sessionsType'
import { formatRelativeTime, normalizeSessionId } from '../../utils'
import { getEmotionTagColor } from '../../constants/emotions'
import Empty from '../common/Empty'

const EMOTION_TAG_OPTIONS = [
    { value: '', label: '全部情绪' },
    { value: '焦虑', label: '焦虑' },
    { value: '抑郁', label: '抑郁' },
    { value: '难过', label: '难过' },
    { value: '压力', label: '压力' },
    { value: '烦躁', label: '烦躁' },
    { value: '孤独', label: '孤独' },
    { value: '疲惫', label: '疲惫' },
]

interface SessionListProps {
    sessions: sessionItemType[]
    currentSessionId?: string
    emotionTagFilter?: string
    onEmotionTagFilterChange?: (tag: string) => void
    onSessionClick: (session: sessionItemType) => void
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export default function SessionList({
    sessions,
    currentSessionId,
    emotionTagFilter = '',
    onEmotionTagFilterChange,
    onSessionClick,
    onDeleteSession,
}: SessionListProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col px-2">
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-medium text-gray-500">历史对话</span>
                <span className="text-xs text-gray-400">{sessions.length}</span>
            </div>
            {onEmotionTagFilterChange && (
                <Select
                    className="mb-2 w-full"
                    size="small"
                    value={emotionTagFilter}
                    options={EMOTION_TAG_OPTIONS}
                    onChange={onEmotionTagFilterChange}
                />
            )}
            <div className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
                {sessions.length > 0 ? sessions.map(item => {
                    const isActive = normalizeSessionId(currentSessionId) === normalizeSessionId(item.id)
                    return (
                        <div
                            key={item.id}
                            className={`group relative cursor-pointer rounded-lg px-3 py-2.5 transition-colors ${
                                isActive
                                    ? 'bg-white shadow-sm ring-1 ring-orange-200'
                                    : 'hover:bg-white/70'
                            }`}
                            onClick={() => onSessionClick(item)}
                        >
                            <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm text-gray-800">{item.sessionTitle}</div>
                                    <div className="mt-0.5 truncate text-xs text-gray-400">
                                        {item.lastMessageContent || '暂无内容'}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    aria-label="删除会话"
                                    className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                                    onClick={(e) => onDeleteSession(item.id.toString(), e)}
                                >
                                    <DeleteOutlined className="text-xs" />
                                </button>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] text-gray-400">{formatRelativeTime(item.lastMessageTime)}</span>
                                {item.emotionTag && (
                                    <Tag color={getEmotionTagColor(item.emotionTag)} className="mr-0 scale-90 text-[10px] leading-none">
                                        {item.emotionTag}
                                    </Tag>
                                )}
                            </div>
                        </div>
                    )
                }) : (
                    <Empty description="暂无对话，点击上方新建" className="py-8" />
                )}
            </div>
        </div>
    )
}
