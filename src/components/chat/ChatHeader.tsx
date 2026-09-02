import { MenuOutlined } from '@ant-design/icons'
import HeartImg from '../../assets/icon5.png'

interface ChatHeaderProps {
    activeAgent?: string | null
    sessionTitle?: string
    onOpenSidebar?: () => void
}

export default function ChatHeader({ activeAgent, sessionTitle, onOpenSidebar }: ChatHeaderProps) {
    return (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
            {onOpenSidebar && (
                <button
                    type="button"
                    aria-label="打开历史对话"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-slate-100 lg:hidden"
                    onClick={onOpenSidebar}
                >
                    <MenuOutlined className="text-sm" />
                </button>
            )}
            <img src={HeartImg} className="h-7 w-7 shrink-0" alt="" />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">
                    {sessionTitle || 'MindHug 小暖'}
                </div>
                <div className="truncate text-[11px] text-gray-500">
                    {activeAgent ? `${activeAgent} 正在服务` : 'AI 心理健康陪伴 · 随时倾听你'}
                </div>
            </div>
        </div>
    )
}
