import { DeleteOutlined, FieldTimeOutlined, MessageOutlined } from '@ant-design/icons'
import type { sessionItemType } from '../../types/sessionsType'
import { formatDate } from '../../utils'
import Empty from '../common/Empty'

interface SessionListProps {
    sessions: sessionItemType[]
    onSessionClick: (session: sessionItemType) => void
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export default function SessionList({ sessions, onSessionClick, onDeleteSession }: SessionListProps) {
    return (
        <div className='border-2 p-2 rounded-md shadow-md'>
            <div className='font-bold'>会话历史</div>
            <div className='max-h-80 overflow-y-scroll scrollbar-hide'>
                {sessions.length > 0 ? sessions.map(item => (
                    <div
                        key={item.id}
                        className='p-3 rounded-lg my-2 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors duration-200 relative'
                        onClick={() => onSessionClick(item)}
                    >
                        <div className='flex justify-between'>
                            <div>{item.sessionTitle}</div>
                            <DeleteOutlined
                                className='text-red-600'
                                onClick={(e) => onDeleteSession(item.id.toString(), e)}
                            />
                        </div>
                        <div className='text-xs text-gray-500'>{item.lastMessageTime}</div>
                        <div className='text-ellipsis text-xs my-1 line-clamp-2 w-60'>
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
