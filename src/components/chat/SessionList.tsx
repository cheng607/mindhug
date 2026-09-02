import { DeleteOutlined, FieldTimeOutlined, MessageOutlined } from '@ant-design/icons'
import { Select, Tag } from 'antd'
import type { sessionItemType } from '../../types/sessionsType'
import { formatDate } from '../../utils'
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
    emotionTagFilter?: string
    onEmotionTagFilterChange?: (tag: string) => void
    onSessionClick: (session: sessionItemType) => void
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export default function SessionList({
    sessions,
    emotionTagFilter = '',
    onEmotionTagFilterChange,
    onSessionClick,
    onDeleteSession,
}: SessionListProps) {
    return (
        <div className='border-2 p-2 rounded-md shadow-md'>
            <div className='font-bold mb-2'>会话历史</div>
            {onEmotionTagFilterChange && (
                <Select
                    className='w-full mb-2'
                    size='small'
                    value={emotionTagFilter}
                    options={EMOTION_TAG_OPTIONS}
                    onChange={onEmotionTagFilterChange}
                />
            )}
            <div className='max-h-80 overflow-y-scroll scrollbar-hide'>
                {sessions.length > 0 ? sessions.map(item => (
                    <div
                        key={item.id}
                        className='p-3 rounded-lg my-2 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors duration-200 relative'
                        onClick={() => onSessionClick(item)}
                    >
                        <div className='flex justify-between items-start gap-2'>
                            <div className='font-medium truncate'>{item.sessionTitle}</div>
                            <DeleteOutlined
                                className='text-red-600 shrink-0'
                                onClick={(e) => onDeleteSession(item.id.toString(), e)}
                            />
                        </div>
                        {item.emotionTag && (
                            <Tag color='green' className='mt-1'>{item.emotionTag}</Tag>
                        )}
                        <div className='text-xs text-gray-500'>{item.lastMessageTime}</div>
                        <div className='text-ellipsis text-xs my-1 line-clamp-2'>
                            {item.lastMessageContent || '暂无内容'}
                        </div>
                        <div className='text-xs text-gray-500 flex gap-3'>
                            <span><MessageOutlined />{item.messageCount || 0}</span>
                            <span><FieldTimeOutlined />{formatDate(item.durationMinutes.toString())}</span>
                        </div>
                    </div>
                )) : (
                    <Empty description="暂无会话历史" className="py-4" />
                )}
            </div>
        </div>
    )
}
