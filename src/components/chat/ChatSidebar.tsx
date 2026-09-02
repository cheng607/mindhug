import { PlusOutlined } from '@ant-design/icons'
import AgentIcon from '../../assets/agent4.png'
import type { emotionAnalysType, sessionItemType } from '../../types/sessionsType'
import EmotionGarden from './EmotionGarden'
import SessionList from './SessionList'

interface ChatSidebarProps {
    sessions: sessionItemType[]
    currentSessionId?: string
    emotion?: emotionAnalysType
    emotionTagFilter?: string
    onNewSession: () => void
    onEmotionTagFilterChange?: (tag: string) => void
    onSessionClick: (session: sessionItemType) => void
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export default function ChatSidebar({
    sessions,
    currentSessionId,
    emotion,
    emotionTagFilter,
    onNewSession,
    onEmotionTagFilterChange,
    onSessionClick,
    onDeleteSession,
}: ChatSidebarProps) {
    return (
        <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-200/80 bg-[#f3f4f6] shadow-xl lg:shadow-none">
            <div className="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2">
                <img src={AgentIcon} alt="" className="h-7 w-7 rounded-full" />
                <span className="text-sm font-medium text-gray-800">MindHug 小暖</span>
            </div>

            <div className="px-2 py-2">
                <button
                    type="button"
                    onClick={onNewSession}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
                >
                    <PlusOutlined />
                    新建对话
                </button>
            </div>

            <SessionList
                sessions={sessions}
                currentSessionId={currentSessionId}
                emotionTagFilter={emotionTagFilter}
                onEmotionTagFilterChange={onEmotionTagFilterChange}
                onSessionClick={onSessionClick}
                onDeleteSession={onDeleteSession}
            />

            <div className="mt-auto shrink-0 border-t border-slate-200/80 p-2">
                <EmotionGarden emotion={emotion} compact />
            </div>
        </aside>
    )
}
